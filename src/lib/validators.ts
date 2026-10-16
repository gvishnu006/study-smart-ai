import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
  course: z.string().trim().max(120).optional().default(""),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  course: z.string().trim().max(120).optional(),
  dailyGoalMinutes: z.coerce.number().int().min(15).max(1440),
  prefs: z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      breakReminders: z.boolean().optional(),
      reducedMotion: z.boolean().optional(),
    })
    .optional(),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required.").max(80),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color.").default("#0d9488"),
  description: z.string().trim().max(300).optional().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export const chapterSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().trim().min(1, "Chapter name is required.").max(120),
  order: z.coerce.number().int().optional().default(0),
  status: z.enum(["not-started", "in-progress", "done"]).optional().default("not-started"),
  topics: z.array(z.string().trim().min(1)).max(200).optional().default([]),
});

export const generateQuizSchema = z.object({
  subjectId: z.string().min(1, "Choose a subject."),
  chapterIds: z.array(z.string()).max(50).optional().default([]),
  materialIds: z.array(z.string()).max(50).optional().default([]),
  types: z
    .array(z.enum(["mcq", "short", "long", "truefalse", "fill"]))
    .min(1, "Pick at least one question type."),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  count: z.coerce.number().int().min(1).max(30).default(10),
  marksType: z.enum(["equal", "byType"]).default("equal"),
  mode: z.enum(["practice", "quiz", "important"]).default("quiz"),
  title: z.string().trim().max(120).optional(),
});

export const attemptSchema = z.object({
  quizId: z.string().min(1),
  durationSeconds: z.coerce.number().int().min(0).max(60 * 60 * 6),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        response: z.string().max(8000).default(""),
        timeSpentSeconds: z.coerce.number().int().min(0).max(60 * 60 * 3).default(0),
      })
    )
    .max(50),
});

export const studySessionSchema = z.object({
  subjectId: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
  durationSeconds: z.coerce.number().int().min(1).max(60 * 60 * 12),
  mode: z.enum(["manual", "pomodoro", "focus", "fiveMin"]).default("manual"),
  note: z.string().max(300).optional().default(""),
});

export const examSchema = z.object({
  subjectId: z.string().min(1, "Choose a subject."),
  title: z.string().trim().min(1, "Exam title is required.").max(120),
  examDate: z.coerce.date(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  importance: z.coerce.number().int().min(1).max(5).default(3),
  syllabusTopics: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        done: z.boolean().optional().default(false),
        weight: z.coerce.number().min(0.5).max(5).optional().default(1),
      })
    )
    .max(100)
    .optional()
    .default([]),
  notes: z.string().max(600).optional().default(""),
});

export const timetableEntrySchema = z.object({
  subjectId: z.string().min(1),
  examId: z.string().optional().nullable(),
  topic: z.string().trim().max(160).default("Study"),
  date: z.coerce.date(),
  startMinutes: z.coerce.number().int().min(0).max(1439),
  endMinutes: z.coerce.number().int().min(1).max(1440),
  source: z.enum(["ai", "manual"]).default("manual"),
});

export const goalSchema = z.object({
  kind: z.enum(["goal", "todo"]).default("todo"),
  title: z.string().trim().min(1, "Title is required.").max(160),
  targetMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  subjectId: z.string().optional().nullable(),
  date: z.coerce.date(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const chatSchema = z.object({
  subjectId: z.string().min(1),
  chapterIds: z.array(z.string()).max(50).optional().default([]),
  materialIds: z.array(z.string()).max(50).optional().default([]),
  question: z.string().trim().min(2, "Ask a question.").max(2000),
});

export const doubtSchema = z.object({
  question: z.string().trim().min(2, "Ask a question.").max(2000),
  subjectId: z.string().optional().nullable(),
});

export const summarizeSchema = z.object({
  subjectId: z.string().min(1, "Choose a subject."),
  chapterIds: z.array(z.string()).max(50).optional().default([]),
  materialIds: z.array(z.string()).max(50).optional().default([]),
  kind: z.enum(["summary", "keypoints", "mindmap", "flashcards"]).default("summary"),
  style: z.enum(["eli10", "detailed"]).optional(),
});

export const flashcardsSaveSchema = z.object({
  subjectId: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  cards: z
    .array(
      z.object({
        front: z.string().trim().min(1).max(500),
        back: z.string().trim().min(1).max(1500),
      })
    )
    .min(1)
    .max(40),
});

export const generateTimetableSchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
  hoursPerDay: z.coerce.number().min(0.5).max(12).default(3),
  sessionMinutes: z.coerce.number().int().min(15).max(180).default(60),
  dayStartMinutes: z.coerce.number().int().min(0).max(1439).default(540),
  dayEndMinutes: z.coerce.number().int().min(1).max(1440).default(1320),
  replaceAuto: z.boolean().default(true),
});
