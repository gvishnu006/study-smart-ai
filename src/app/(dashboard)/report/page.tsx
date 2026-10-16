import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import { getReportData } from "@/lib/report";
import { PageHeader } from "@/components/shared/page-header";
import { ReportView } from "@/components/report/report-view";

export const metadata: Metadata = { title: "Progress report" };
export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const userId = await requireUserPage();
  await connectDB();
  const data = await getReportData(userId, "week");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress report"
        description="See how your study time and quiz scores are trending, then download a PDF summary."
      />
      <ReportView initial={data} />
    </div>
  );
}
