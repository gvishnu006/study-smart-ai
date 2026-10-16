import mongoose, { Schema, Model, models, Types } from "mongoose";

export type QuestionType =
  | "mcq"
  | "short"
  | "long"
  | "truefalse"
  | "fill";

export interface IQuestion {
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  chapterId?: Types.ObjectId | null;
  materialId?: Types.ObjectId | null;
  quizId?: Types.ObjectId | null;
  type: QuestionType;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  topic: string;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", default: null },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", default: null },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", default: null },
    type: {
      type: String,
      enum: ["mcq", "short", "long", "truefalse", "fill"],
      required: true,
    },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    answer: { type: String, required: true },
    explanation: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    marks: { type: Number, default: 1 },
    topic: { type: String, default: "General" },
    importance: { type: Number, default: 3, min: 1, max: 5 },
  },
  { timestamps: true }
);

const Question: Model<IQuestion> =
  (models.Question as Model<IQuestion>) ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
