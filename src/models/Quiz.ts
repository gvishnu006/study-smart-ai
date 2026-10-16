import mongoose, { Schema, Model, models, Types } from "mongoose";
import type { QuestionType } from "./Question";

export interface IQuiz {
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  chapterIds: Types.ObjectId[];
  materialId?: Types.ObjectId | null;
  title: string;
  mode: "practice" | "quiz" | "important";
  config: {
    types: QuestionType[];
    difficulty: "easy" | "medium" | "hard" | "mixed";
    count: number;
    marksType: "equal" | "byType";
  };
  questionIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", index: true },
    chapterIds: [{ type: Schema.Types.ObjectId, ref: "Chapter" }],
    materialId: { type: Schema.Types.ObjectId, ref: "Material", default: null },
    title: { type: String, required: true },
    mode: {
      type: String,
      enum: ["practice", "quiz", "important"],
      default: "quiz",
    },
    config: {
      types: { type: [String], default: ["mcq"] },
      difficulty: { type: String, default: "medium" },
      count: { type: Number, default: 10 },
      marksType: { type: String, default: "equal" },
    },
    questionIds: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  },
  { timestamps: true }
);

const Quiz: Model<IQuiz> =
  (models.Quiz as Model<IQuiz>) || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
