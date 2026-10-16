import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IStudySession {
  userId: Types.ObjectId;
  subjectId?: Types.ObjectId | null;
  chapterId?: Types.ObjectId | null;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  mode: "manual" | "pomodoro" | "focus" | "fiveMin";
  note?: string;
  dateKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", default: null },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },
    mode: {
      type: String,
      enum: ["manual", "pomodoro", "focus", "fiveMin"],
      default: "manual",
    },
    note: { type: String, default: "" },
    dateKey: { type: String, index: true },
  },
  { timestamps: true }
);

StudySessionSchema.index({ userId: 1, dateKey: 1 });

const StudySession: Model<IStudySession> =
  (models.StudySession as Model<IStudySession>) ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);

export default StudySession;
