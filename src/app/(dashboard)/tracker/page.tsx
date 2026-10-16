import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import { getTrackerData } from "@/lib/tracker";
import { PageHeader } from "@/components/shared/page-header";
import { TrackerView } from "@/components/tracker/tracker-view";

export const metadata: Metadata = { title: "Study tracker" };
export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const userId = await requireUserPage();
  await connectDB();

  const [subjects, tracker] = await Promise.all([
    Subject.find({ userId }).sort({ createdAt: 1 }).lean(),
    getTrackerData(userId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study tracker"
        description="Track focused study time with a stopwatch or Pomodoro timer, and watch your hours stack up."
      />
      <TrackerView
        subjects={subjects.map((s) => ({
          _id: String(s._id),
          name: s.name,
          color: s.color,
        }))}
        initial={tracker}
      />
    </div>
  );
}
