import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import User from "@/models/User";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await requireUserPage();
  await connectDB();

  const [user, data] = await Promise.all([
    User.findById(userId).lean(),
    getDashboardData(userId),
  ]);

  return <DashboardView name={user?.name ?? "there"} data={data} />;
}
