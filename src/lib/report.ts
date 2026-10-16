import { Types } from "mongoose";
import StudySession from "@/models/StudySession";
import QuizAttempt from "@/models/QuizAttempt";
import Subject from "@/models/Subject";
import Goal from "@/models/Goal";
import { computeWeakTopics } from "@/lib/queries";
import { toDateKey, getStartOfDay } from "@/lib/utils";

export type ReportRange = "week" | "month" | "all";

export interface ReportData {
  range: ReportRange;
  fromKey: string;
  toKey: string;
  totalMinutes: number;
  sessionsCount: number;
  activeDays: number;
  subjectBreakdown: { name: string; color: string; minutes: number }[];
  dailyMinutes: { date: string; label: string; minutes: number }[];
  quizzes: {
    _id: string;
    title: string;
    subject: string;
    subjectColor: string;
    percentage: number;
    completedAt: string;
  }[];
  quizzesTaken: number;
  averagePercentage: number;
  bestPercentage: number;
  weakTopics: { topic: string; subject: string; accuracy: number; attempts: number }[];
  strongTopics: { topic: string; subject: string; accuracy: number; attempts: number }[];
  goalsTotal: number;
  goalsCompleted: number;
}

export async function getReportData(
  userId: string,
  range: ReportRange
): Promise<ReportData> {
  const uid = new Types.ObjectId(userId);
  const now = new Date();
  const from = new Date(now);
  if (range === "week") from.setDate(from.getDate() - 6);
  else if (range === "month") from.setDate(from.getDate() - 29);
  else from.setFullYear(from.getFullYear() - 5);
  from.setHours(0, 0, 0, 0);

  const [sessions, attempts, subjects, goals] = await Promise.all([
    StudySession.find({ userId: uid, startedAt: { $gte: from } })
      .sort({ startedAt: 1 })
      .lean(),
    QuizAttempt.find({ userId: uid, completedAt: { $gte: from } })
      .sort({ completedAt: -1 })
      .lean(),
    Subject.find({ userId: uid }).lean(),
    Goal.find({ userId: uid, date: { $gte: from } }).lean(),
  ]);

  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  // subject breakdown + daily series
  const bySubject = new Map<string, number>();
  const byDay = new Map<string, number>();
  let totalSeconds = 0;
  const activeDaySet = new Set<string>();

  for (const s of sessions) {
    totalSeconds += s.durationSeconds;
    activeDaySet.add(s.dateKey);
    const sk = s.subjectId ? String(s.subjectId) : "__general";
    bySubject.set(sk, (bySubject.get(sk) ?? 0) + s.durationSeconds);
    byDay.set(s.dateKey, (byDay.get(s.dateKey) ?? 0) + s.durationSeconds);
  }

  const subjectBreakdown = Array.from(bySubject.entries())
    .map(([id, sec]) => ({
      name:
        id === "__general"
          ? "General"
          : subjectMap.get(id)?.name ?? "Other",
      color: id === "__general" ? "#94a3b8" : subjectMap.get(id)?.color ?? "#94a3b8",
      minutes: Math.round(sec / 60),
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const dailyMinutes: { date: string; label: string; minutes: number }[] = [];
  const dayCount = range === "week" ? 7 : range === "month" ? 30 : 0;
  if (dayCount > 0) {
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(getStartOfDay(now));
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      dailyMinutes.push({
        date: key,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        minutes: Math.round((byDay.get(key) ?? 0) / 60),
      });
    }
  } else {
    for (const [key, sec] of Array.from(byDay.entries()).sort()) {
      dailyMinutes.push({
        date: key,
        label: new Date(key + "T00:00:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        minutes: Math.round(sec / 60),
      });
    }
  }

  const quizzes = attempts.slice(0, 12).map((a) => ({
    _id: String(a._id),
    title: a.title,
    subject: subjectMap.get(String(a.subjectId))?.name ?? "General",
    subjectColor: subjectMap.get(String(a.subjectId))?.color ?? "#94a3b8",
    percentage: a.percentage,
    completedAt: a.completedAt.toISOString(),
  }));

  const percentages = attempts.map((a) => a.percentage);
  const averagePercentage = percentages.length
    ? Math.round(percentages.reduce((s, p) => s + p, 0) / percentages.length)
    : 0;
  const bestPercentage = percentages.length ? Math.max(...percentages) : 0;

  const weakAll = await computeWeakTopics(userId);
  const weakTopics = weakAll.filter((t) => t.accuracy < 60).slice(0, 6);
  const strongTopics = [...weakAll]
    .filter((t) => t.accuracy >= 75 && t.attempts >= 2)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 6);

  const goalsTotal = goals.length;
  const goalsCompleted = goals.filter((g) => g.done).length;

  return {
    range,
    fromKey: toDateKey(from),
    toKey: toDateKey(now),
    totalMinutes: Math.round(totalSeconds / 60),
    sessionsCount: sessions.length,
    activeDays: activeDaySet.size,
    subjectBreakdown,
    dailyMinutes,
    quizzes,
    quizzesTaken: attempts.length,
    averagePercentage,
    bestPercentage,
    weakTopics,
    strongTopics,
    goalsTotal,
    goalsCompleted,
  };
}
