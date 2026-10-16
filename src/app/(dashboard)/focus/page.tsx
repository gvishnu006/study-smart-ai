import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import { FocusMode } from "@/components/focus/focus-mode";

export const metadata: Metadata = { title: "Focus mode" };
export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const userId = await requireUserPage();
  await connectDB();
  const subjects = await Subject.find({ userId }).sort({ createdAt: 1 }).lean();

  return (
    <FocusMode
      subjects={subjects.map((s) => ({
        _id: String(s._id),
        name: s.name,
        color: s.color,
      }))}
    />
  );
}
