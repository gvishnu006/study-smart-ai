import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import Subject from "@/models/Subject";
import { apiHandler, ok } from "@/lib/api";
import { requireUserId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const userId = await requireUserId();
  await connectDB();

  const quizzes = await Quiz.find({ userId }).sort({ createdAt: -1 }).limit(60).lean();
  if (quizzes.length === 0) return ok([]);

  const subjectIds = Array.from(new Set(quizzes.map((q) => String(q.subjectId))));
  const subjects = await Subject.find({ _id: { $in: subjectIds }, userId }).lean();
  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  const attempts = await QuizAttempt.find({
    userId,
    quizId: { $in: quizzes.map((q) => q._id) },
  })
    .select("quizId percentage")
    .lean();
  const attemptMap = new Map<string, { count: number; best: number }>();
  for (const a of attempts) {
    const key = String(a.quizId);
    const cur = attemptMap.get(key) ?? { count: 0, best: 0 };
    cur.count += 1;
    cur.best = Math.max(cur.best, a.percentage);
    attemptMap.set(key, cur);
  }

  return ok(
    quizzes.map((q) => {
      const meta = subjectMap.get(String(q.subjectId));
      const stats = attemptMap.get(String(q._id));
      return {
        _id: String(q._id),
        title: q.title,
        mode: q.mode,
        subjectId: String(q.subjectId),
        subjectName: meta?.name ?? "Subject",
        subjectColor: meta?.color ?? "#0d9488",
        questionIds: q.questionIds.map(String),
        createdAt: q.createdAt.toISOString(),
        attemptCount: stats?.count ?? 0,
        bestScore: stats?.best ?? 0,
      };
    })
  );
});
