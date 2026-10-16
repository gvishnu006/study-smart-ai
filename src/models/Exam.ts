import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface ISyllabusTopic {
  name: string;
  done: boolean;
  weight: number;
}

export interface IExam {
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  examDate: Date;
  difficulty: "easy" | "medium" | "hard";
  importance: number;
  syllabusTopics: ISyllabusTopic[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true, index: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    importance: { type: Number, default: 3, min: 1, max: 5 },
    syllabusTopics: [
      {
        name: { type: String, required: true },
        done: { type: Boolean, default: false },
        weight: { type: Number, default: 1 },
      },
    ],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Exam: Model<IExam> =
  (models.Exam as Model<IExam>) || mongoose.model<IExam>("Exam", ExamSchema);

export default Exam;
