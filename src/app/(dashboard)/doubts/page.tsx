import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import { PageHeader } from "@/components/shared/page-header";
import { DoubtSolver } from "@/components/doubts/doubt-solver";

export const metadata: Metadata = { title: "Doubt solver" };
export const dynamic = "force-dynamic";

export default async function DoubtsPage() {
  const userId = await requireUserPage();
  await connectDB();
  const subjects = await Subject.find({ userId }).sort({ createdAt: 1 }).lean();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doubt solver"
        description="Stuck? Ask anything and get a patient, step-by-step explanation grounded in your material."
      />
      <DoubtSolver
        subjects={subjects.map((s) => ({
          _id: String(s._id),
          name: s.name,
          color: s.color,
        }))}
      />
    </div>
  );
}
