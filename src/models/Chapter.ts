import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IChapter {
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  name: string;
  order: number;
  status: "not-started" | "in-progress" | "done";
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "done"],
      default: "not-started",
    },
    topics: { type: [String], default: [] },
  },
  { timestamps: true }
);

ChapterSchema.index({ subjectId: 1, name: 1 }, { unique: true });

const Chapter: Model<IChapter> =
  (models.Chapter as Model<IChapter>) ||
  mongoose.model<IChapter>("Chapter", ChapterSchema);

export default Chapter;
