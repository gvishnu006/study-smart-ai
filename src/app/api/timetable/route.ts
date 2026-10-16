import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import TimetableEntry from "@/models/TimetableEntry";
import Subject from "@/models/Subject";
import Exam from "@/models/Exam";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { timetableEntrySchema } from "@/lib/validators";
import { toDateKey } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  await connectDB();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const query: Record<string, unknown> = { userId };
  if (from && to) {
    query.dateKey = { $gte: from, $lte: to };
  }

  const [entries, subjects, exams] = await Promise.all([
    TimetableEntry.find(query).sort({ dateKey: 1, startMinutes: 1 }).lean(),
    Subject.find({ userId }).lean(),
    Exam.find({ userId }).lean(),
  ]);
  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );
  const examMap = new Map(exams.map((e) => [String(e._id), e.title]));

  return ok(
    entries.map((e) => ({
      _id: String(e._id),
      subjectId: String(e.subjectId),
      subjectName: subjectMap.get(String(e.subjectId))?.name ?? "Subject",
      subjectColor: subjectMap.get(String(e.subjectId))?.color ?? "#0d9488",
      examId: e.examId ? String(e.examId) : null,
      examTitle: e.examId ? examMap.get(String(e.examId)) ?? null : null,
      topic: e.topic,
      dateKey: e.dateKey,
      startMinutes: e.startMinutes,
      endMinutes: e.endMinutes,
      done: e.done,
      source: e.source,
    }))
  );
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const data = await parseJson(req, timetableEntrySchema);
  await connectDB();

  if (data.endMinutes <= data.startMinutes) {
    return fail("End time must be after the start time.", 400);
  }

  const entry = await TimetableEntry.create({
    userId: new Types.ObjectId(userId),
    subjectId: new Types.ObjectId(data.subjectId),
    examId: data.examId ? new Types.ObjectId(data.examId) : null,
    topic: data.topic,
    date: data.date,
    dateKey: toDateKey(data.date),
    startMinutes: data.startMinutes,
    endMinutes: data.endMinutes,
    source: data.source,
  });
  return ok({ _id: entry._id.toString() }, 201);
});

export const DELETE = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  await connectDB();
  const url = new URL(req.url);
  const subjectId = url.searchParams.get("subjectId");

  const query: Record<string, unknown> = { userId };
  if (subjectId) query.subjectId = new Types.ObjectId(subjectId);
  const result = await TimetableEntry.deleteMany(query);
  return ok({ deleted: result.deletedCount ?? 0 });
});
