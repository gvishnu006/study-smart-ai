import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import { PageHeader } from "@/components/shared/page-header";
import { QuizView } from "@/components/quiz/quiz-view";

export const metadata: Metadata = { title: "Quiz" };
export const dynamic = "force-dynamic";

export default async function QuizPage({
  searchParams,
}: {
  searchParams: { quick?: string };
}) {
  const userId = await requireUserPage();
  await connectDB();

  const [subjects, chapters, quizzes, attempts] = await Promise.all([
    Subject.find({ userId }).sort({ createdAt: 1 }).lean(),
    Chapter.find({ userId }).sort({ order: 1 }).lean(),
    Quiz.find({ userId }).sort({ createdAt: -1 }).limit(60).lean(),
    QuizAttempt.find({ userId }).sort({ completedAt: -1 }).limit(40).lean(),
  ]);

  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  const attemptStats = new Map<string, { count: number; best: number }>();
  for (const a of attempts) {
    const key = String(a.quizId);
    const cur = attemptStats.get(key) ?? { count: 0, best: 0 };
    cur.count += 1;
    cur.best = Math.max(cur.best, a.percentage);
    attemptStats.set(key, cur);
  }

  const subjectsDTO = subjects.map((s) => ({
    _id: String(s._id),
    name: s.name,
    color: s.color,
    description: s.description ?? "",
    difficulty: s.difficulty,
  }));

  const chaptersDTO = chapters.map((c) => ({
    _id: String(c._id),
    subjectId: String(c.subjectId),
    name: c.name,
    order: c.order,
    status: c.status,
    topics: c.topics ?? [],
  }));

  const quizzesDTO = quizzes.map((q) => {
    const meta = subjectMap.get(String(q.subjectId));
    const stats = attemptStats.get(String(q._id));
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
  });

  const attemptsDTO = attempts.map((a) => ({
    _id: String(a._id),
    quizId: String(a.quizId),
    title: a.title,
    subjectId: String(a.subjectId),
    subjectName: subjectMap.get(String(a.subjectId))?.name ?? "Subject",
    subjectColor: subjectMap.get(String(a.subjectId))?.color ?? "#0d9488",
    score: a.score,
    totalMarks: a.totalMarks,
    percentage: a.percentage,
    weakTopics: a.weakTopics,
    strongTopics: a.strongTopics,
    durationSeconds: a.durationSeconds,
    completedAt: a.completedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI quizzes"
        description="Generate MCQs, short and long answers, true/false and fill-in-the-blanks from your own notes. Take a timed quiz and instantly see your weak topics."
      />
      <QuizView
        subjects={subjectsDTO}
        chapters={chaptersDTO}
        initialQuizzes={quizzesDTO}
        initialAttempts={attemptsDTO}
        quickMode={searchParams?.quick === "1"}
      />
    </div>
  );
}
