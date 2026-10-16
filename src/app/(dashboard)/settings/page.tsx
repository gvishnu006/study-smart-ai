import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import User from "@/models/User";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await requireUserPage();
  await connectDB();
  const user = await User.findById(userId).lean();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance and study preferences."
      />
      <SettingsView
        initial={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          course: user?.course ?? "",
          image: user?.image ?? null,
          provider: user?.provider ?? "credentials",
          dailyGoalMinutes: user?.dailyGoalMinutes ?? 120,
          prefs: {
            theme: user?.prefs?.theme,
            breakReminders: user?.prefs?.breakReminders ?? true,
            reducedMotion: user?.prefs?.reducedMotion ?? false,
          },
        }}
      />
    </div>
  );
}
