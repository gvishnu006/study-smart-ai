"use client";

import { useCallback, useState } from "react";
import { Clock, CalendarDays, CalendarRange, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch } from "@/lib/fetcher";
import { formatDuration, formatHours } from "@/lib/utils";
import { TimerCard } from "@/components/tracker/timer-card";
import { StudyHoursChart, SubjectPie } from "@/components/tracker/stats-charts";

export interface TrackerData {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  dailyGoalMinutes: number;
  streak: { current: number; longest: number };
  daily: { label: string; minutes: number; date: string }[];
  weekly: { label: string; minutes: number; date: string }[];
  monthly: { label: string; minutes: number; date: string }[];
  distribution: { name: string; value: number; color: string }[];
  recent: {
    _id: string;
    subjectId: string | null;
    subjectName: string;
    subjectColor: string;
    startedAt: string;
    endedAt: string;
    durationSeconds: number;
    mode: string;
    dateKey: string;
  }[];
}

export function TrackerView({
  subjects,
  initial,
}: {
  subjects: { _id: string; name: string; color: string }[];
  initial: TrackerData;
}) {
  const [data, setData] = useState<TrackerData>(initial);

  const refresh = useCallback(async () => {
    try {
      const fresh = await apiFetch<TrackerData>("/api/study-sessions");
      setData(fresh);
    } catch {
      /* keep old data */
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today"
          value={formatHours(data.todayMinutes / 60)}
          icon={Clock}
          hint={`Goal ${data.dailyGoalMinutes} min`}
        />
        <StatCard
          label="This week"
          value={formatHours(data.weekMinutes / 60)}
          icon={CalendarDays}
          accent="accent"
        />
        <StatCard
          label="This month"
          value={formatHours(data.monthMinutes / 60)}
          icon={CalendarRange}
          accent="success"
        />
        <StatCard
          label="Streak"
          value={`${data.streak.current} day${data.streak.current === 1 ? "" : "s"}`}
          icon={Flame}
          accent="warning"
          hint={`Longest ${data.streak.longest}`}
        />
      </div>

      <TimerCard
        subjects={subjects}
        todayMinutes={data.todayMinutes}
        dailyGoalMinutes={data.dailyGoalMinutes}
        onSaved={refresh}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <StudyHoursChart
          daily={data.daily}
          weekly={data.weekly}
          monthly={data.monthly}
        />
        <SubjectPie distribution={data.distribution} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No sessions yet"
              description="Start the timer above to log your first study session."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((s) => (
                <li key={s._id} className="flex items-center gap-3 py-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.subjectColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.subjectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.startedAt).toLocaleString(undefined, {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {s.mode === "pomodoro" ? " · Pomodoro" : ""}
                    </p>
                  </div>
                  <span className="font-display text-sm font-semibold tabular-nums">
                    {formatDuration(s.durationSeconds)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
