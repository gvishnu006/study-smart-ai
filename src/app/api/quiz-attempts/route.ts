import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import QuizAttempt from "@/models/QuizAttempt";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import Subject from "@/models/Subject";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { attemptSchema } from "@/lib/validators";
import { gradeAnswers, type GradeItem } from "@/lib/grading";
import { updateStreak } from "@/lib/queries";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const GET = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = Number(new URL(req.url).searchParams.get("limit") || 30);
  await connectDB();

  const attempts = await QuizAttempt.find({ userId })
    .sort({ completedAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();

  const subjectIds = Array.from(
    new Set(attempts.map((a) => String(a.subjectId)).filter(Boolean))
  );
  const subjects = subjectIds.length
    ? await Subject.find({ _id: { $in: subjectIds }, userId }).lean()
    : [];
  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  return ok(
    attempts.map((a) => ({
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
    }))
  );
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const input = await parseJson(req, attemptSchema);
  await connectDB();

  const quiz = await Quiz.findOne({ _id: input.quizId, userId });
  if (!quiz) return fail("Quiz not found.", 404);

  const questions = await Question.find({
    _id: { $in: input.answers.map((a) => a.questionId) },
    userId,
  }).lean();

  const qMap = new Map(questions.map((q) => [String(q._id), q]));

  const gradeItems: GradeItem[] = [];
  for (const ans of input.answers) {
    const q = qMap.get(ans.questionId);
    if (!q) continue;
    gradeItems.push({
      id: ans.questionId,
      type: q.type,
      response: ans.response,
      answer: q.answer,
      explanation: q.explanation,
    });
  }

  const graded = await gradeAnswers(gradeItems);
  const gradeMap = new Map(graded.map((g) => [g.id, g]));

  let score = 0;
  let totalMarks = 0;
  const topicStats = new Map<string, { correct: number; total: number }>();

  const answerDocs = input.answers
    .filter((ans) => qMap.has(ans.questionId))
    .map((ans) => {
      const q = qMap.get(ans.questionId)!;
      const g = gradeMap.get(ans.questionId);
      const correct = g?.correct ?? false;
      totalMarks += q.marks;
      if (correct) score += q.marks;
      const stat = topicStats.get(q.topic) ?? { correct: 0, total: 0 };
      stat.total += 1;
      if (correct) stat.correct += 1;
      topicStats.set(q.topic, stat);
      return {
        questionId: new Types.ObjectId(ans.questionId),
        response: ans.response,
        correct,
        timeSpentSeconds: ans.timeSpentSeconds,
        topic: q.topic,
        type: q.type,
      };
    });

  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const [topic, stat] of topicStats.entries()) {
    const acc = stat.correct / stat.total;
    if (acc < 0.6) weakTopics.push(topic);
    else if (acc === 1) strongTopics.push(topic);
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const attempt = await QuizAttempt.create({
    userId,
    quizId: quiz._id,
    subjectId: quiz.subjectId,
    title: quiz.title,
    answers: answerDocs,
    score,
    totalMarks,
    percentage,
    weakTopics,
    strongTopics,
    durationSeconds: input.durationSeconds,
    completedAt: new Date(),
  });

  await updateStreak(userId);

  return ok(
    {
      _id: attempt._id.toString(),
      quizId: quiz._id.toString(),
      title: quiz.title,
      score,
      totalMarks,
      percentage,
      weakTopics,
      strongTopics,
      durationSeconds: input.durationSeconds,
      completedAt: attempt.completedAt.toISOString(),
      results: answerDocs.map((a) => ({
        questionId: String(a.questionId),
        correct: a.correct,
        response: a.response,
      })),
    },
    201
  );
});
