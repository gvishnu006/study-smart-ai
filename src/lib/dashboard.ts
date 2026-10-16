import { Types } from "mongoose";
import StudySession from "@/models/StudySession";
import QuizAttempt from "@/models/QuizAttempt";
import Subject from "@/models/Subject";
import Exam from "@/models/Exam";
import Goal from "@/models/Goal";
import TimetableEntry from "@/models/TimetableEntry";
import User from "@/models/User";
import { computeWeakTopics } from "@/lib/queries";
import { toDateKey, getStartOfDay, daysBetween } from "@/lib/utils";
import type { DashboardData } from "@/types/app";

const FALLBACK_TIPS = [
  "Try the 5-minute rule: commit to just five minutes. Starting is the hardest part, and momentum usually carries you further.",
  "Test yourself before you feel ready. Retrieval practice beats re-reading every single time.",
  "One topic at a time, phone in another room. Depth beats a scattered hour.",
  "End today's session by writing the three things you'd explain to a friend tomorrow.",
  "Space it out. A short review tomorrow is worth more than another hour tonight.",
];

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const uid = new Types.ObjectId(userId);
  const now = new Date();
  const todayKey = toDateKey(now);
  const weekAgo = new Date(getStartOfDay(now));
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [
    user,
    sessions,
    subjects,
    attempts,
    upcomingExamDocs,
    weakTopics,
    todayGoals,
    todayEntries,
  ] = await Promise.all([
    User.findById(userId).lean(),
    StudySession.find({ userId: uid, startedAt: { $gte: weekAgo } }).lean(),
    Subject.find({ userId: uid }).lean(),
    QuizAttempt.find({ userId: uid }).sort({ completedAt: -1 }).limit(5).lean(),
    Exam.find({ userId: uid, examDate: { $gte: now } })
      .sort({ examDate: 1 })
      .limit(5)
      .lean(),
    computeWeakTopics(userId),
    Goal.find({ userId: uid, dateKey: todayKey }).sort({ createdAt: 1 }).lean(),
    TimetableEntry.find({ userId: uid, dateKey: todayKey })
      .sort({ startMinutes: 1 })
      .lean(),
  ]);

  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  let todaySeconds = 0;
  let weekSeconds = 0;
  const byDay = new Map<string, number>();
  const bySubject = new Map<string, number>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(getStartOfDay(now));
    d.setDate(d.getDate() - i);
    byDay.set(toDateKey(d), 0);
  }

  for (const s of sessions) {
    weekSeconds += s.durationSeconds;
    if (s.dateKey === todayKey) todaySeconds += s.durationSeconds;
    if (byDay.has(s.dateKey)) {
      byDay.set(s.dateKey, (byDay.get(s.dateKey) ?? 0) + s.durationSeconds);
    }
    const sk = s.subjectId ? String(s.subjectId) : "__general";
    bySubject.set(sk, (bySubject.get(sk) ?? 0) + s.durationSeconds);
  }

  const weekly = Array.from(byDay.entries()).map(([key, sec]) => ({
    day: new Date(key + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
    }),
    minutes: Math.round(sec / 60),
  }));

  const subjectDistribution = Array.from(bySubject.entries())
    .map(([id, sec]) => ({
      name: id === "__general" ? "General" : subjectMap.get(id)?.name ?? "Other",
      color: id === "__general" ? "#94a3b8" : subjectMap.get(id)?.color ?? "#94a3b8",
      value: Math.round(sec / 60),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const upcomingExams = upcomingExamDocs.map((e) => ({
    _id: String(e._id),
    subjectId: String(e.subjectId),
    subjectName: subjectMap.get(String(e.subjectId))?.name ?? "Subject",
    subjectColor: subjectMap.get(String(e.subjectId))?.color ?? "#0d9488",
    title: e.title,
    examDate: e.examDate.toISOString(),
    difficulty: e.difficulty,
    importance: e.importance,
    syllabusTopics: e.syllabusTopics,
    topicsDone: e.syllabusTopics.filter((t) => t.done).length,
    topicsTotal: e.syllabusTopics.length,
    daysLeft: daysBetween(now, e.examDate),
  }));

  const recentAttempts = attempts.map((a) => ({
    _id: String(a._id),
    quizId: String(a.quizId),
    title: a.title,
    subjectId: String(a.subjectId),
    subjectName: subjectMap.get(String(a.subjectId))?.name ?? "General",
    subjectColor: subjectMap.get(String(a.subjectId))?.color ?? "#94a3b8",
    score: a.score,
    totalMarks: a.totalMarks,
    percentage: a.percentage,
    weakTopics: a.weakTopics,
    strongTopics: a.strongTopics,
    durationSeconds: a.durationSeconds,
    completedAt: a.completedAt.toISOString(),
  }));

  const tipIdx = (now.getDate() + (user?.streak.current ?? 0)) % FALLBACK_TIPS.length;

  return {
    streak: {
      current: user?.streak.current ?? 0,
      longest: user?.streak.longest ?? 0,
    },
    dailyGoalMinutes: user?.dailyGoalMinutes ?? 120,
    todayMinutes: Math.round(todaySeconds / 60),
    hoursThisWeek: Math.round((weekSeconds / 3600) * 10) / 10,
    weekly,
    subjectDistribution,
    upcomingExams,
    recentAttempts,
    weakTopics: weakTopics.slice(0, 5),
    todayPlan: todayGoals.map((g) => ({
      _id: String(g._id),
      kind: g.kind,
      title: g.title,
      targetMinutes: g.targetMinutes ?? 0,
      subjectId: g.subjectId ? String(g.subjectId) : null,
      subjectName: g.subjectId
        ? subjectMap.get(String(g.subjectId))?.name ?? null
        : null,
      subjectColor: g.subjectId
        ? subjectMap.get(String(g.subjectId))?.color ?? null
        : null,
      dateKey: g.dateKey,
      done: g.done,
      priority: g.priority,
    })),
    todayTimetable: todayEntries.map((e) => ({
      _id: String(e._id),
      subjectId: String(e.subjectId),
      subjectName: subjectMap.get(String(e.subjectId))?.name ?? "Subject",
      subjectColor: subjectMap.get(String(e.subjectId))?.color ?? "#0d9488",
      examId: e.examId ? String(e.examId) : null,
      topic: e.topic,
      dateKey: e.dateKey,
      startMinutes: e.startMinutes,
      endMinutes: e.endMinutes,
      done: e.done,
      source: e.source,
    })),
    aiTip: FALLBACK_TIPS[tipIdx],
    hasData: sessions.length > 0 || subjects.length > 0,
  };
}
