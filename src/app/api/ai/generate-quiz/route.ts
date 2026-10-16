import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import Subject from "@/models/Subject";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { generateQuizSchema } from "@/lib/validators";
import { getMaterialContext } from "@/lib/queries";
import { gatherMaterialText } from "@/lib/text";
import { callClaudeJson, aiConfigured } from "@/lib/ai";
import {
  QUIZ_SYSTEM,
  IMPORTANT_SYSTEM,
  quizUserPrompt,
  importantUserPrompt,
} from "@/lib/prompts";
import type { QuestionType } from "@/models/Question";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_TYPES: QuestionType[] = ["mcq", "short", "long", "truefalse", "fill"];

interface RawQuestion {
  type?: string;
  question?: string;
  options?: unknown;
  answer?: string;
  explanation?: string;
  difficulty?: string;
  marks?: number;
  topic?: string;
  importance?: number;
}

function marksFor(type: QuestionType, marksType: "equal" | "byType") {
  if (marksType === "equal") return 1;
  switch (type) {
    case "long":
      return 5;
    case "short":
      return 3;
    default:
      return 1;
  }
}

function normalizeQuestion(
  raw: RawQuestion,
  fallbackDifficulty: string,
  marksType: "equal" | "byType"
): {
  type: QuestionType;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  topic: string;
  importance: number;
} | null {
  const type = VALID_TYPES.includes(raw.type as QuestionType)
    ? (raw.type as QuestionType)
    : null;
  if (!type || !raw.question || !raw.answer) return null;

  let options: string[] = Array.isArray(raw.options)
    ? raw.options.map((o) => String(o)).filter(Boolean)
    : [];

  if (type === "mcq") {
    if (options.length < 2) return null;
    options = options.slice(0, 4);
    if (!options.some((o) => o.trim() === String(raw.answer).trim())) {
      // If the model's answer text isn't in options, keep answer but add it.
      options[0] = String(raw.answer);
    }
  } else if (type === "truefalse") {
    options = ["True", "False"];
  } else {
    options = [];
  }

  const difficulty = ["easy", "medium", "hard"].includes(raw.difficulty || "")
    ? (raw.difficulty as "easy" | "medium" | "hard")
    : fallbackDifficulty === "mixed"
      ? "medium"
      : (fallbackDifficulty as "easy" | "medium" | "hard");

  return {
    type,
    question: String(raw.question).trim(),
    options,
    answer: String(raw.answer).trim(),
    explanation: String(raw.explanation || "").trim(),
    difficulty,
    marks: Number(raw.marks) > 0 ? Number(raw.marks) : marksFor(type, marksType),
    topic: (raw.topic && String(raw.topic).trim()) || "General",
    importance: Math.min(5, Math.max(1, Number(raw.importance) || 3)),
  };
}

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`gen-quiz:${userId}`, 10, 60_000);
  if (!limit.success) {
    return fail("You're generating quizzes very quickly. Please wait a moment.", 429);
  }
  if (!aiConfigured()) {
    return fail(
      "AI is not configured on this server. Add ANTHROPIC_API_KEY to enable quiz generation.",
      503
    );
  }

  const input = await parseJson(req, generateQuizSchema);
  await connectDB();

  const subject = await Subject.findOne({ _id: input.subjectId, userId });
  if (!subject) return fail("Subject not found.", 404);

  const materials = await getMaterialContext(userId, {
    subjectId: input.materialIds.length ? undefined : input.subjectId,
    chapterIds: input.chapterIds,
    materialIds: input.materialIds,
  });

  if (materials.length === 0) {
    return fail(
      "No study material found for this selection. Upload a material first.",
      400
    );
  }

  const material = gatherMaterialText(materials, 40000);
  const count = input.mode === "important" ? Math.min(input.count, 20) : input.count;

  const raw = await callClaudeJson<{ questions?: RawQuestion[] }>({
    system: input.mode === "important" ? IMPORTANT_SYSTEM : QUIZ_SYSTEM,
    messages: [
      {
        role: "user",
        content:
          input.mode === "important"
            ? importantUserPrompt({ count, material })
            : quizUserPrompt({
                types: input.types,
                difficulty: input.difficulty,
                count,
                material,
              }),
      },
    ],
    maxTokens: 4000,
    temperature: 0.5,
  });

  const normalized = (raw.questions || [])
    .map((q) => normalizeQuestion(q, input.difficulty, input.marksType))
    .filter((q): q is NonNullable<typeof q> => q !== null)
    .slice(0, count);

  if (normalized.length === 0) {
    return fail(
      "The AI could not produce valid questions from this material. Try adding more content or selecting fewer files.",
      422
    );
  }

  const title =
    input.title?.trim() ||
    `${subject.name} · ${input.mode === "important" ? "Important questions" : "Quiz"} · ${new Date().toLocaleDateString()}`;

  const quiz = await Quiz.create({
    userId,
    subjectId: new Types.ObjectId(input.subjectId),
    chapterIds: input.chapterIds.map((id) => new Types.ObjectId(id)),
    materialId: input.materialIds[0]
      ? new Types.ObjectId(input.materialIds[0])
      : null,
    title,
    mode: input.mode,
    config: {
      types: input.types,
      difficulty: input.difficulty,
      count: normalized.length,
      marksType: input.marksType,
    },
    questionIds: [],
  });

  const questions = await Question.insertMany(
    normalized.map((q) => ({
      ...q,
      userId,
      subjectId: new Types.ObjectId(input.subjectId),
      chapterId: input.chapterIds[0]
        ? new Types.ObjectId(input.chapterIds[0])
        : null,
      materialId: input.materialIds[0]
        ? new Types.ObjectId(input.materialIds[0])
        : null,
      quizId: quiz._id,
    }))
  );

  quiz.questionIds = questions.map((q) => q._id);
  await quiz.save();

  return ok({
    _id: quiz._id.toString(),
    title: quiz.title,
    mode: quiz.mode,
    subjectId: input.subjectId,
    subjectName: subject.name,
    subjectColor: subject.color,
    questionIds: questions.map((q) => q._id.toString()),
    createdAt: quiz.createdAt.toISOString(),
    questions: questions.map((q) => ({
      _id: q._id.toString(),
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
});
