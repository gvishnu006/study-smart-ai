import mongoose, { Schema, Model, models } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  provider: "credentials" | "google";
  course?: string;
  dailyGoalMinutes: number;
  streak: {
    current: number;
    longest: number;
    lastStudyDate?: Date | null;
  };
  prefs: {
    theme?: "light" | "dark" | "system";
    breakReminders: boolean;
    reducedMotion: boolean;
  };
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: false },
    image: { type: String },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    course: { type: String, trim: true, default: "" },
    dailyGoalMinutes: { type: Number, default: 120, min: 15, max: 1440 },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastStudyDate: { type: Date, default: null },
    },
    prefs: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      breakReminders: { type: Boolean, default: true },
      reducedMotion: { type: Boolean, default: false },
    },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  (models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
