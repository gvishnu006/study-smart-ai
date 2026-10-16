import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IFlashcard {
  userId: Types.ObjectId;
  subjectId?: Types.ObjectId | null;
  chapterId?: Types.ObjectId | null;
  materialId?: Types.ObjectId | null;
  front: string;
  back: string;
  familiarity: number;
  lastReviewed?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", default: null },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", default: null },
    front: { type: String, required: true },
    back: { type: String, required: true },
    familiarity: { type: Number, default: 0, min: 0, max: 5 },
    lastReviewed: { type: Date, default: null },
  },
  { timestamps: true }
);

const Flashcard: Model<IFlashcard> =
  (models.Flashcard as Model<IFlashcard>) ||
  mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);

export default Flashcard;
