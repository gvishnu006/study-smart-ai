import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Exam from "@/models/Exam";
import Subject from "@/models/Subject";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { examSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/ratelimit";
import { daysBetween } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const userId = await requireUserId();
  await connectDB();

  const [exams, subjects] = await Promise.all([
    Exam.find({ userId }).sort({ examDate: 1 }).lean(),
    Subject.find({ userId }).lean(),
  ]);
  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  const today = new Date();
  return ok(
    exams.map((e) => {
      const topicsDone = e.syllabusTopics.filter((t) => t.done).length;
      return {
        _id: String(e._id),
        subjectId: String(e.subjectId),
        subjectName: subjectMap.get(String(e.subjectId))?.name ?? "Subject",
        subjectColor: subjectMap.get(String(e.subjectId))?.color ?? "#0d9488",
        title: e.title,
        examDate: e.examDate.toISOString(),
        difficulty: e.difficulty,
        importance: e.importance,
        syllabusTopics: e.syllabusTopics,
        topicsDone,
        topicsTotal: e.syllabusTopics.length,
        daysUntil: daysBetween(today, e.examDate),
        notes: e.notes ?? "",
      };
    })
  );
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`exam:${userId}`, 30, 60_000);
  if (!limit.success) return fail("Too many requests.", 429);
  const data = await parseJson(req, examSchema);
  await connectDB();

  const exam = await Exam.create({
    ...data,
    subjectId: new Types.ObjectId(data.subjectId),
    userId: new Types.ObjectId(userId),
  });
  return ok({ _id: exam._id.toString() }, 201);
});
