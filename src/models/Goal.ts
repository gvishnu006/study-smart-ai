import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IGoal {
  userId: Types.ObjectId;
  kind: "goal" | "todo";
  title: string;
  targetMinutes?: number;
  subjectId?: Types.ObjectId | null;
  date: Date;
  dateKey: string;
  done: boolean;
  completedAt?: Date | null;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["goal", "todo"], default: "todo" },
    title: { type: String, required: true, trim: true },
    targetMinutes: { type: Number, default: 0 },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    date: { type: Date, required: true },
    dateKey: { type: String, index: true },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1, dateKey: 1 });

const Goal: Model<IGoal> =
  (models.Goal as Model<IGoal>) || mongoose.model<IGoal>("Goal", GoalSchema);

export default Goal;
