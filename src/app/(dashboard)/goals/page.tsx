import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import { PageHeader } from "@/components/shared/page-header";
import { GoalsView } from "@/components/goals/goals-view";

export const metadata: Metadata = { title: "Goals & To-dos" };
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const userId = await requireUserPage();
  await connectDB();

  const subjects = await Subject.find({ userId }).sort({ createdAt: 1 }).lean();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals & to-dos"
        description="Plan each day with clear targets. Turn intentions into completed sessions."
      />
      <GoalsView
        subjects={subjects.map((s) => ({
          _id: String(s._id),
          name: s.name,
          color: s.color,
        }))}
      />
    </div>
  );
}
