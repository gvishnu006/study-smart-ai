import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import { PageHeader } from "@/components/shared/page-header";
import { PlannerView } from "@/components/planner/planner-view";

export const metadata: Metadata = { title: "Planner" };
export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const userId = await requireUserPage();
  await connectDB();

  const subjects = await Subject.find({ userId }).sort({ createdAt: 1 }).lean();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study planner"
        description="Schedule every exam and let the AI build a balanced revision timetable around your dates."
      />
      <PlannerView
        subjects={subjects.map((s) => ({
          _id: String(s._id),
          name: s.name,
          color: s.color,
        }))}
        initialExams={[]}
        initialEntries={[]}
      />
    </div>
  );
}
