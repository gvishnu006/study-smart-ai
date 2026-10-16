import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface ISubject {
  userId: Types.ObjectId;
  name: string;
  color: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#0d9488" },
    description: { type: String, trim: true, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true }
);

SubjectSchema.index({ userId: 1, name: 1 }, { unique: true });

const Subject: Model<ISubject> =
  (models.Subject as Model<ISubject>) ||
  mongoose.model<ISubject>("Subject", SubjectSchema);

export default Subject;
