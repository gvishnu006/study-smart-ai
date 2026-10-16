import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Exam from "@/models/Exam";
import Subject from "@/models/Subject";
import TimetableEntry from "@/models/TimetableEntry";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { generateTimetableSchema } from "@/lib/validators";
import { callClaudeJson, aiConfigured } from "@/lib/ai";
import { TIMETABLE_SYSTEM, timetableUserPrompt } from "@/lib/prompts";
import { daysBetween, toDateKey } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

interface RawEntry {
  subjectId?: string;
  examId?: string | null;
  topic?: string;
  dateKey?: string;
  startMinutes?: number;
  endMinutes?: number;
}

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`gen-timetable:${userId}`, 6, 60_000);
  if (!limit.success) {
    return fail("You're generating plans very quickly. Please wait a moment.", 429);
  }
  if (!aiConfigured()) {
    return fail(
      "AI is not configured on this server. Add ANTHROPIC_API_KEY to enable AI planning.",
      503
    );
  }

  const input = await parseJson(req, generateTimetableSchema);
  await connectDB();

  const [exams, subjects] = await Promise.all([
    Exam.find({ userId }).sort({ examDate: 1 }),
    Subject.find({ userId }),
  ]);

  if (subjects.length === 0) {
    return fail("Add at least one subject before generating a plan.", 400);
  }

  const subjectMap = new Map(subjects.map((s) => [String(s._id), s]));
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dateKeys: string[] = [];
  for (let i = 0; i < input.days; i++) {
    const d = new Date(dayStart);
    d.setDate(d.getDate() + i);
    dateKeys.push(toDateKey(d));
  }
  const allowedDates = new Set(dateKeys);

  const examPayload = exams.map((e) => ({
    examId: String(e._id),
    subjectId: String(e.subjectId),
    subject: subjectMap.get(String(e.subjectId))?.name ?? "Subject",
    title: e.title,
    dateKey: toDateKey(e.examDate),
    daysUntil: daysBetween(now, e.examDate),
    importance: e.importance,
    difficulty: e.difficulty,
    topics: e.syllabusTopics.filter((t) => !t.done).map((t) => t.name),
  }));

  const raw = await callClaudeJson<{ entries?: RawEntry[] }>({
    system: TIMETABLE_SYSTEM,
    messages: [
      {
        role: "user",
        content: timetableUserPrompt({
          todayKey: toDateKey(now),
          dateKeys,
          hoursPerDay: input.hoursPerDay,
          dayStartMinutes: input.dayStartMinutes,
          dayEndMinutes: input.dayEndMinutes,
          sessionMinutes: input.sessionMinutes,
          exams: examPayload,
        }),
      },
    ],
    maxTokens: 4000,
    temperature: 0.4,
  });

  const validExamIds = new Set(exams.map((e) => String(e._id)));

  const entries = (raw.entries || [])
    .map((e) => {
      const subjectId = String(e.subjectId || "");
      if (!subjectMap.has(subjectId)) return null;
      const dateKey = String(e.dateKey || "");
      if (!allowedDates.has(dateKey)) return null;
      let start = Math.round(Number(e.startMinutes));
      let end = Math.round(Number(e.endMinutes));
      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
      if (start < 0) start = 0;
      if (end > 1440) end = 1440;
      if (end <= start) return null;
      const examId =
        e.examId && validExamIds.has(String(e.examId)) ? String(e.examId) : null;
      return {
        subjectId,
        examId,
        topic: (e.topic || "Study").toString().slice(0, 160),
        dateKey,
        startMinutes: start,
        endMinutes: end,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .slice(0, input.days * 8);

  if (entries.length === 0) {
    return fail(
      "The AI could not build a plan. Add exams with dates and try again.",
      422
    );
  }

  if (input.replaceAuto) {
    await TimetableEntry.deleteMany({
      userId,
      source: "ai",
      dateKey: { $in: dateKeys },
    });
  }

  await TimetableEntry.insertMany(
    entries.map((e) => ({
      userId: new Types.ObjectId(userId),
      subjectId: new Types.ObjectId(e.subjectId),
      examId: e.examId ? new Types.ObjectId(e.examId) : null,
      topic: e.topic,
      date: new Date(`${e.dateKey}T00:00:00`),
      dateKey: e.dateKey,
      startMinutes: e.startMinutes,
      endMinutes: e.endMinutes,
      source: "ai" as const,
    }))
  );

  return ok({ created: entries.length }, 201);
});
