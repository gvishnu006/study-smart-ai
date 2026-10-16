import { connectDB } from "@/lib/db";
import { apiHandler, ok } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { getReportData, type ReportRange } from "@/lib/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: ReportRange[] = ["week", "month", "all"];

export const GET = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  await connectDB();
  const url = new URL(req.url);
  const raw = url.searchParams.get("range") as ReportRange | null;
  const range: ReportRange = raw && VALID.includes(raw) ? raw : "week";
  const data = await getReportData(userId, range);
  return ok(data);
});
