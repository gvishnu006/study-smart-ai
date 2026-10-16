"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Flame,
  Clock,
  CalendarDays,
  Target,
  Sparkles,
  ArrowRight,
  Lightbulb,
  TrendingDown,
  Timer,
  Zap,
  Upload,
  Brain,
  Check,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/stat-card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch } from "@/lib/fetcher";
import { cn, formatHours } from "@/lib/utils";
import type { DashboardData } from "@/types/app";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardView({
  name,
  data,
}: {
  name: string;
  data: DashboardData;
}) {
  const [tip, setTip] = useState(data.aiTip);

  useEffect(() => {
    let active = true;
    apiFetch<{ tip: string }>("/api/ai/tip")
      .then((r) => active && r.tip && setTip(r.tip))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const goalPct =
    data.dailyGoalMinutes > 0
      ? (data.todayMinutes / data.dailyGoalMinutes) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {greeting()}, {name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.hasData
              ? "Here's your study overview for today."
              : "Let's get your study space set up."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/tracker">
              <Timer className="h-4 w-4" /> Start focus
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/quiz?quick=1">
              <Zap className="h-4 w-4" /> 5-min quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today"
          value={formatHours(data.todayMinutes / 60)}
          icon={Clock}
          hint={`Goal ${data.dailyGoalMinutes} min`}
        />
        <StatCard
          label="This week"
          value={`${data.hoursThisWeek}h`}
          icon={CalendarDays}
          accent="accent"
        />
        <StatCard
          label="Streak"
          value={`${data.streak.current} day${data.streak.current === 1 ? "" : "s"}`}
          icon={Flame}
          accent="warning"
          hint={`Longest ${data.streak.longest}`}
        />
        <StatCard
          label="Avg. quiz score"
          value={
            data.recentAttempts.length
              ? `${Math.round(
                  data.recentAttempts.reduce((s, a) => s + a.percentage, 0) /
                    data.recentAttempts.length
                )}%`
              : "—"
          }
          icon={Trophy}
          accent="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily goal ring + weekly chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative shrink-0">
              <ProgressRing
                value={goalPct}
                size={140}
                stroke={11}
                barClassName={goalPct >= 100 ? "text-success" : "text-primary"}
              >
                <span className="font-display text-2xl font-bold">
                  {Math.round(goalPct)}%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  of daily goal
                </span>
              </ProgressRing>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.weekly}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lift">
                          <p className="font-medium">{label}</p>
                          <p className="text-muted-foreground">
                            {formatHours(Number(payload[0].value) / 60)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {data.weekly.map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.minutes >= data.dailyGoalMinutes
                            ? "hsl(var(--success))"
                            : "hsl(var(--primary))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI tip */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> Tip of the day
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.p
              key={tip}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm leading-relaxed text-foreground/90"
            >
              {tip}
            </motion.p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/summarize">
                <Sparkles className="h-4 w-4" /> Open AI tools
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming exams */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming exams</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/planner">
                Plan <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.upcomingExams.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No exams scheduled"
                description="Add exams in the planner to get a smart revision timetable."
                action={{ label: "Add an exam", href: "/planner" }}
              />
            ) : (
              <ul className="space-y-3">
                {data.upcomingExams.map((e) => {
                  const pct =
                    e.topicsTotal && e.topicsTotal > 0
                      ? ((e.topicsDone ?? 0) / e.topicsTotal) * 100
                      : 0;
                  const urgent = e.daysLeft <= 7;
                  return (
                    <li key={e._id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: e.subjectColor }}
                          />
                          <span className="truncate text-sm font-medium">
                            {e.title}
                          </span>
                        </div>
                        <Badge
                          variant={urgent ? "destructive" : "secondary"}
                          className="shrink-0"
                        >
                          {e.daysLeft <= 0
                            ? "Today"
                            : `${e.daysLeft} day${e.daysLeft === 1 ? "" : "s"}`}
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Weak topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Topics to
              review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.weakTopics.length === 0 ? (
              <EmptyState
                icon={Brain}
                title="No weak topics yet"
                description="Take a quiz and we'll highlight the topics you should revise."
                action={{ label: "Take a quiz", href: "/quiz" }}
              />
            ) : (
              <ul className="space-y-3">
                {data.weakTopics.map((t) => (
                  <li
                    key={`${t.topic}-${t.subject}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.topic}</p>
                      <p className="text-xs text-muted-foreground">{t.subject}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-display text-sm font-bold",
                        t.accuracy < 40 ? "text-destructive" : "text-warning"
                      )}
                    >
                      {t.accuracy}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's plan */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Today&apos;s plan
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/goals">
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.todayPlan.length === 0 && data.todayTimetable.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Nothing planned for today"
                description="Set a few goals or generate a study plan to structure your day."
                action={{ label: "Set goals", href: "/goals" }}
              />
            ) : (
              <ul className="space-y-2">
                {data.todayPlan.map((g) => (
                  <li key={g._id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded border",
                        g.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {g.done ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span
                      className={cn(
                        "truncate",
                        g.done && "text-muted-foreground line-through"
                      )}
                    >
                      {g.title}
                    </span>
                  </li>
                ))}
                {data.todayTimetable.map((e) => (
                  <li
                    key={e._id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: e.subjectColor }}
                      />
                      <span className="truncate">{e.subjectName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {Math.floor(e.startMinutes / 60)}:
                      {String(e.startMinutes % 60).padStart(2, "0")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent quizzes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent quizzes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/report">
                Report <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentAttempts.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="No quizzes taken"
                description="Generate a quiz from your material to start testing yourself."
                action={{ label: "Go to quizzes", href: "/quiz" }}
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentAttempts.map((a) => (
                  <li
                    key={a._id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: a.subjectColor }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-display text-sm font-bold",
                        a.percentage >= 75
                          ? "text-success"
                          : a.percentage >= 50
                            ? "text-warning"
                            : "text-destructive"
                      )}
                    >
                      {Math.round(a.percentage)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {!data.hasData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                Add your first study material
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload PDFs, notes or slides and the AI will unlock quizzes,
                summaries and flashcards.
              </p>
            </div>
            <Button asChild>
              <Link href="/materials">
                <Upload className="h-4 w-4" /> Upload material
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
