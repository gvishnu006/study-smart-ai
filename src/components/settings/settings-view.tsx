"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  User,
  Bell,
  Palette,
  Lock,
  Loader2,
  Save,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiFetch, apiPatch } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

interface Profile {
  name: string;
  email: string;
  course: string;
  image: string | null;
  provider: "credentials" | "google";
  dailyGoalMinutes: number;
  prefs: {
    theme?: "light" | "dark" | "system";
    breakReminders: boolean;
    reducedMotion: boolean;
  };
}

export function SettingsView({ initial }: { initial: Profile }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(initial.name);
  const [course, setCourse] = useState(initial.course);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(
    initial.dailyGoalMinutes
  );
  const [breakReminders, setBreakReminders] = useState(
    initial.prefs.breakReminders
  );
  const [reducedMotion, setReducedMotion] = useState(
    initial.prefs.reducedMotion
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await apiPatch("/api/profile", {
        name: name.trim(),
        course,
        dailyGoalMinutes,
        prefs: { breakReminders, reducedMotion },
      });
      toast.success("Settings saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  const themes: { value: "light" | "dark" | "system"; icon: typeof Sun; label: string }[] =
    [
      { value: "light", icon: Sun, label: "Light" },
      { value: "dark", icon: Moon, label: "Dark" },
      { value: "system", icon: Monitor, label: "System" },
    ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="set-name">Name</Label>
              <Input
                id="set-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-course">Course / class</Label>
              <Input
                id="set-course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. Grade 12 Science"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-goal">Daily study goal (minutes)</Label>
            <Input
              id="set-goal"
              type="number"
              min={15}
              max={1440}
              step={15}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
            />
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Email: </span>
            {initial.email}
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
              {initial.provider}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setTheme(t.value);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                    theme === t.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Pomodoro break reminders</p>
              <p className="text-xs text-muted-foreground">
                Play a sound when a focus block ends.
              </p>
            </div>
            <Switch
              checked={breakReminders}
              onCheckedChange={setBreakReminders}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reduce motion</p>
              <p className="text-xs text-muted-foreground">
                Minimise animations across the app.
              </p>
            </div>
            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>

      {/* Password */}
      {initial.provider === "credentials" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Change password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur-pass">Current password</Label>
              <Input
                id="cur-pass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New password</Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={changePassword}
                disabled={savingPassword || !currentPassword || !newPassword}
              >
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Update password
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
