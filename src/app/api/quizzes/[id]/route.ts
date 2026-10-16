import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import Subject from "@/models/Subject";
import { apiHandler, ok, fail } from "@/lib/api";
import { requireUserId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    await connectDB();
    const quiz = await Quiz.findOne({ _id: params.id, userId }).lean();
    if (!quiz) return fail("Quiz not found.", 404);

    const [questions, subject] = await Promise.all([
      Question.find({ _id: { $in: quiz.questionIds }, userId }).lean(),
      Subject.findOne({ _id: quiz.subjectId, userId }).lean(),
    ]);

    const order = new Map(quiz.questionIds.map((id, i) => [String(id), i]));
    questions.sort(
      (a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0)
    );

    return ok({
      _id: String(quiz._id),
      title: quiz.title,
      mode: quiz.mode,
      subjectId: String(quiz.subjectId),
      subjectName: subject?.name ?? "Subject",
      subjectColor: subject?.color ?? "#0d9488",
      createdAt: quiz.createdAt.toISOString(),
      questionIds: quiz.questionIds.map(String),
      questions: questions.map((q) => ({
        _id: String(q._id),
        type: q.type,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        marks: q.marks,
        topic: q.topic,
        importance: q.importance,
      })),
    });
  }
);

export const DELETE = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    await connectDB();
    const quiz = await Quiz.findOne({ _id: params.id, userId });
    if (!quiz) return fail("Quiz not found.", 404);
    await Question.deleteMany({ quizId: quiz._id, userId });
    await Quiz.deleteOne({ _id: quiz._id });
    return ok({ deleted: true });
  }
);
