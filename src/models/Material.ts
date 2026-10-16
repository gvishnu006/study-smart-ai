import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IMaterial {
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  chapterId?: Types.ObjectId | null;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  text: string;
  charCount: number;
  status: "processing" | "ready" | "failed";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    text: { type: String, default: "" },
    charCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

const Material: Model<IMaterial> =
  (models.Material as Model<IMaterial>) ||
  mongoose.model<IMaterial>("Material", MaterialSchema);

export default Material;
