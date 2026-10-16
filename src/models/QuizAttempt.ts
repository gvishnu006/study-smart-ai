import mongoose, { Schema, Model, models, Types } from "mongoose";
import type { QuestionType } from "./Question";

export interface IAttemptAnswer {
  questionId: Types.ObjectId;
  response: string;
  correct: boolean;
  timeSpentSeconds: number;
  topic: string;
  type: QuestionType;
}

export interface IQuizAttempt {
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  answers: IAttemptAnswer[];
  score: number;
  totalMarks: number;
  percentage: number;
  weakTopics: string[];
  strongTopics: string[];
  durationSeconds: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ANSWER_TYPES = ["mcq", "short", "long", "truefalse", "fill"];

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", index: true },
    title: { type: String, required: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question" },
        response: { type: String, default: "" },
        correct: { type: Boolean, default: false },
        timeSpentSeconds: { type: Number, default: 0 },
        topic: { type: String, default: "General" },
        type: { type: String, enum: ANSWER_TYPES, default: "mcq" },
      },
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    weakTopics: { type: [String], default: [] },
    strongTopics: { type: [String], default: [] },
    durationSeconds: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const QuizAttempt: Model<IQuizAttempt> =
  (models.QuizAttempt as Model<IQuizAttempt>) ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);

export default QuizAttempt;
