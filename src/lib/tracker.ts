import { Types } from "mongoose";
import StudySession from "@/models/StudySession";
import Subject from "@/models/Subject";
import User from "@/models/User";
import { toDateKey, getStartOfDay } from "@/lib/utils";

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

function startOfWeek(d: Date) {
  const date = getStartOfDay(d);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday start
  date.setDate(date.getDate() - diff);
  return date;
}

export async function getTrackerData(userId: string): Promise<TrackerData> {
  const since = new Date();
  since.setDate(since.getDate() - 200);

  const [sessions, subjects, user] = await Promise.all([
    StudySession.find({
      userId: new Types.ObjectId(userId),
      startedAt: { $gte: since },
    })
      .sort({ startedAt: -1 })
      .lean(),
    Subject.find({ userId: new Types.ObjectId(userId) }).lean(),
    User.findById(userId).lean(),
  ]);

  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  const now = new Date();
  const todayKey = toDateKey(now);
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let todaySeconds = 0;
  let weekSeconds = 0;
  let monthSeconds = 0;

  const dayBuckets = new Map<string, number>();
  const weekBuckets = new Map<string, number>();
  const monthBuckets = new Map<string, number>();
  const subjectTotals = new Map<string, number>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayBuckets.set(toDateKey(d), 0);
  }
  for (let i = 7; i >= 0; i--) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - i * 7);
    weekBuckets.set(toDateKey(d), 0);
  }
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }

  for (const s of sessions) {
    const started = new Date(s.startedAt);
    const sec = s.durationSeconds;
    if (s.dateKey === todayKey) todaySeconds += sec;
    if (started >= weekStart) weekSeconds += sec;
    if (started >= monthStart) monthSeconds += sec;

    const dk = s.dateKey || toDateKey(started);
    if (dayBuckets.has(dk)) dayBuckets.set(dk, (dayBuckets.get(dk) ?? 0) + sec);

    const wk = toDateKey(startOfWeek(started));
    if (weekBuckets.has(wk)) weekBuckets.set(wk, (weekBuckets.get(wk) ?? 0) + sec);

    const mk = `${started.getFullYear()}-${started.getMonth()}`;
    if (monthBuckets.has(mk)) monthBuckets.set(mk, (monthBuckets.get(mk) ?? 0) + sec);

    if (s.subjectId) {
      const key = String(s.subjectId);
      subjectTotals.set(key, (subjectTotals.get(key) ?? 0) + sec);
    }
  }

  const daily = Array.from(dayBuckets.entries()).map(([key, sec]) => ({
    date: key,
    label: new Date(key + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
    }),
    minutes: Math.round(sec / 60),
  }));

  const weekly = Array.from(weekBuckets.entries()).map(([key, sec]) => ({
    date: key,
    label: new Date(key + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    minutes: Math.round(sec / 60),
  }));

  const monthly = Array.from(monthBuckets.entries()).map(([key, sec]) => {
    const [y, m] = key.split("-").map(Number);
    return {
      date: key,
      label: new Date(y, m, 1).toLocaleDateString(undefined, { month: "short" }),
      minutes: Math.round(sec / 60),
    };
  });

  const distribution = Array.from(subjectTotals.entries())
    .map(([id, sec]) => ({
      name: subjectMap.get(id)?.name ?? "Other",
      color: subjectMap.get(id)?.color ?? "#94a3b8",
      value: Math.round(sec / 60),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const recent = sessions.slice(0, 25).map((s) => ({
    _id: String(s._id),
    subjectId: s.subjectId ? String(s.subjectId) : null,
    subjectName: s.subjectId
      ? subjectMap.get(String(s.subjectId))?.name ?? "Subject"
      : "General",
    subjectColor: s.subjectId
      ? subjectMap.get(String(s.subjectId))?.color ?? "#0d9488"
      : "#94a3b8",
    startedAt: new Date(s.startedAt).toISOString(),
    endedAt: new Date(s.endedAt).toISOString(),
    durationSeconds: s.durationSeconds,
    mode: s.mode,
    dateKey: s.dateKey,
  }));

  return {
    todayMinutes: Math.round(todaySeconds / 60),
    weekMinutes: Math.round(weekSeconds / 60),
    monthMinutes: Math.round(monthSeconds / 60),
    dailyGoalMinutes: user?.dailyGoalMinutes ?? 120,
    streak: {
      current: user?.streak.current ?? 0,
      longest: user?.streak.longest ?? 0,
    },
    daily,
    weekly,
    monthly,
    distribution,
    recent,
  };
}
