import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface ITimetableEntry {
  userId: Types.ObjectId;
  examId?: Types.ObjectId | null;
  subjectId: Types.ObjectId;
  topic: string;
  date: Date;
  dateKey: string;
  startMinutes: number;
  endMinutes: number;
  done: boolean;
  source: "ai" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

const TimetableEntrySchema = new Schema<ITimetableEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", default: null },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    topic: { type: String, default: "Study" },
    date: { type: Date, required: true },
    dateKey: { type: String, index: true },
    startMinutes: { type: Number, required: true },
    endMinutes: { type: Number, required: true },
    done: { type: Boolean, default: false },
    source: { type: String, enum: ["ai", "manual"], default: "ai" },
  },
  { timestamps: true }
);

TimetableEntrySchema.index({ userId: 1, dateKey: 1 });

const TimetableEntry: Model<ITimetableEntry> =
  (models.TimetableEntry as Model<ITimetableEntry>) ||
  mongoose.model<ITimetableEntry>("TimetableEntry", TimetableEntrySchema);

export default TimetableEntry;
