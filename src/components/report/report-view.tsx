"use client";

import { useCallback, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import {
  Clock,
  CalendarDays,
  ListChecks,
  Target,
  FileDown,
  Loader2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch } from "@/lib/fetcher";
import { cn, formatHours } from "@/lib/utils";
import type { ReportData, ReportRange } from "@/lib/report";

export function ReportView({ initial }: { initial: ReportData }) {
  const [range, setRange] = useState<ReportRange>(initial.range);
  const [data, setData] = useState<ReportData>(initial);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (r: ReportRange) => {
    setLoading(true);
    try {
      setData(await apiFetch<ReportData>(`/api/report?range=${r}`));
    } catch {
      toast.error("Could not load report.");
    } finally {
      setLoading(false);
    }
  }, []);

  function changeRange(r: ReportRange) {
    setRange(r);
    load(r);
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      let y = 56;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("StudySmart AI — Progress Report", margin, y);
      y += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `Range: ${data.fromKey} to ${data.toKey}  ·  Generated ${new Date().toLocaleString()}`,
        margin,
        y
      );
      y += 28;

      const section = (title: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text(title, margin, y);
        y += 18;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(60);
      };
      const line = (text: string) => {
        doc.text(text, margin, y);
        y += 16;
      };
      const ensureSpace = () => {
        if (y > 780) {
          doc.addPage();
          y = 56;
        }
      };

      section("Overview");
      line(`Total study time: ${formatHours(data.totalMinutes / 60)}`);
      line(`Sessions logged: ${data.sessionsCount}`);
      line(`Active days: ${data.activeDays}`);
      line(
        `Quizzes taken: ${data.quizzesTaken}  ·  Average score: ${data.averagePercentage}%  ·  Best: ${data.bestPercentage}%`
      );
      line(`Goals completed: ${data.goalsCompleted} / ${data.goalsTotal}`);
      y += 10;

      ensureSpace();
      section("Study time by subject");
      if (data.subjectBreakdown.length === 0) {
        line("No study sessions in this period.");
      } else {
        for (const s of data.subjectBreakdown) {
          line(`- ${s.name}: ${formatHours(s.minutes / 60)}`);
        }
      }
      y += 10;

      ensureSpace();
      section("Quiz results");
      if (data.quizzes.length === 0) {
        line("No quizzes attempted in this period.");
      } else {
        for (const q of data.quizzes) {
          ensureSpace();
          line(
            `- ${q.title} (${q.subject}) — ${Math.round(q.percentage)}% on ${new Date(
              q.completedAt
            ).toLocaleDateString()}`
          );
        }
      }
      y += 10;

      ensureSpace();
      section("Topics to review");
      if (data.weakTopics.length === 0) {
        line("No weak topics detected — nice.");
      } else {
        for (const t of data.weakTopics) {
          line(`- ${t.topic} (${t.subject}) — ${t.accuracy}% accuracy`);
        }
      }
      y += 10;

      ensureSpace();
      section("Strengths");
      if (data.strongTopics.length === 0) {
        line("Take a few more quizzes to reveal your strengths.");
      } else {
        for (const t of data.strongTopics) {
          line(`- ${t.topic} (${t.subject}) — ${t.accuracy}% accuracy`);
        }
      }

      doc.save(`studysmart-report-${data.toKey}.pdf`);
      toast.success("Report downloaded.");
    } catch {
      toast.error("Could not create the PDF.");
    } finally {
      setExporting(false);
    }
  }

  const hasData = data.sessionsCount > 0 || data.quizzesTaken > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={range}
          onValueChange={(v) => changeRange(v as ReportRange)}
        >
          <TabsList>
            <TabsTrigger value="week">This week</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={exportPdf} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Download PDF
        </Button>
      </div>

      {!hasData && range !== "all" ? (
        <EmptyState
          icon={FileDown}
          title="Not enough data yet"
          description="Log some study sessions and take a quiz, then come back for a full report."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Study time"
              value={formatHours(data.totalMinutes / 60)}
              icon={Clock}
              hint={`${data.sessionsCount} sessions`}
            />
            <StatCard
              label="Active days"
              value={data.activeDays}
              icon={CalendarDays}
              accent="accent"
            />
            <StatCard
              label="Avg. score"
              value={data.quizzesTaken ? `${data.averagePercentage}%` : "—"}
              icon={ListChecks}
              accent="success"
              hint={`Best ${data.bestPercentage}%`}
            />
            <StatCard
              label="Goals done"
              value={`${data.goalsCompleted}/${data.goalsTotal}`}
              icon={Target}
              accent="warning"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Study minutes per day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.dailyMinutes}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      interval="preserveStartEnd"
                    />
                    <Tooltip
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
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#repFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By subject</CardTitle>
              </CardHeader>
              <CardContent>
                {data.subjectBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No sessions in this period.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.subjectBreakdown.map((s) => {
                      const max = data.subjectBreakdown[0].minutes || 1;
                      return (
                        <li key={s.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: s.color }}
                              />
                              {s.name}
                            </span>
                            <span className="font-medium">
                              {formatHours(s.minutes / 60)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(s.minutes / max) * 100}%`,
                                backgroundColor: s.color,
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiz performance</CardTitle>
              </CardHeader>
              <CardContent>
                {data.quizzes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No quizzes attempted in this period.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.quizzes.map((q) => (
                      <li
                        key={q._id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{q.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {q.subject} ·{" "}
                            {new Date(q.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 font-display text-sm font-bold",
                            q.percentage >= 75
                              ? "text-success"
                              : q.percentage >= 50
                                ? "text-warning"
                                : "text-destructive"
                          )}
                        >
                          {Math.round(q.percentage)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" /> Needs work
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.weakTopics.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    No weak topics detected.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.weakTopics.map((t) => (
                      <li
                        key={`${t.topic}-${t.subject}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {t.topic}{" "}
                          <span className="text-muted-foreground">
                            · {t.subject}
                          </span>
                        </span>
                        <span className="shrink-0 font-medium text-destructive">
                          {t.accuracy}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.strongTopics.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    Take a few more quizzes to reveal your strengths.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.strongTopics.map((t) => (
                      <li
                        key={`${t.topic}-${t.subject}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                          <span className="truncate">{t.topic}</span>
                        </span>
                        <span className="shrink-0 font-medium text-success">
                          {t.accuracy}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {loading ? (
        <p className="text-center text-xs text-muted-foreground">Updating…</p>
      ) : null}
    </div>
  );
}
