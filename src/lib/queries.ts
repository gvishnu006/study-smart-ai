import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Material from "@/models/Material";
import Chapter from "@/models/Chapter";
import QuizAttempt from "@/models/QuizAttempt";
import User from "@/models/User";
import { toDateKey, getStartOfDay } from "@/lib/utils";
import type { MaterialLike } from "@/lib/text";

export async function getMaterialContext(
  userId: string,
  opts: {
    subjectId?: string;
    chapterIds?: string[];
    materialIds?: string[];
  }
): Promise<MaterialLike[]> {
  await connectDB();
  const query: Record<string, unknown> = { userId, status: "ready" };

  if (opts.materialIds && opts.materialIds.length > 0) {
    query._id = { $in: opts.materialIds.map((id) => new Types.ObjectId(id)) };
  } else {
    if (opts.subjectId) query.subjectId = new Types.ObjectId(opts.subjectId);
    if (opts.chapterIds && opts.chapterIds.length > 0) {
      query.chapterId = { $in: opts.chapterIds.map((id) => new Types.ObjectId(id)) };
    }
  }

  const materials = await Material.find(query).lean();
  if (materials.length === 0) return [];

  const chapterIds = materials
    .map((m) => m.chapterId)
    .filter((c): c is Types.ObjectId => Boolean(c));
  const chapters = chapterIds.length
    ? await Chapter.find({ _id: { $in: chapterIds } }).lean()
    : [];
  const chapterMap = new Map(chapters.map((c) => [String(c._id), c.name]));

  return materials.map((m) => ({
    title: m.title,
    text: m.text,
    chapterName: m.chapterId ? chapterMap.get(String(m.chapterId)) : undefined,
  }));
}

export interface WeakTopic {
  topic: string;
  subject: string;
  accuracy: number;
  attempts: number;
}

export async function computeWeakTopics(
  userId: string,
  subjectId?: string
): Promise<WeakTopic[]> {
  await connectDB();
  const match: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  if (subjectId) match.subjectId = new Types.ObjectId(subjectId);

  const attempts = await QuizAttempt.find(match)
    .sort({ completedAt: -1 })
    .limit(40)
    .populate("subjectId", "name")
    .lean();

  const map = new Map<
    string,
    { correct: number; total: number; subject: string }
  >();

  for (const attempt of attempts) {
    const subjectName =
      (attempt.subjectId as unknown as { name?: string })?.name ?? "General";
    for (const answer of attempt.answers) {
      const key = `${answer.topic}__${subjectName}`;
      const entry = map.get(key) ?? { correct: 0, total: 0, subject: subjectName };
      entry.total += 1;
      if (answer.correct) entry.correct += 1;
      map.set(key, entry);
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({
      topic: key.split("__")[0],
      subject: v.subject,
      accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
      attempts: v.total,
    }))
    .filter((t) => t.attempts >= 1)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export async function updateStreak(userId: string) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) return;

  const today = getStartOfDay(new Date());
  const last = user.streak.lastStudyDate
    ? getStartOfDay(user.streak.lastStudyDate)
    : null;

  if (last && toDateKey(last) === toDateKey(today)) {
    return; // already counted today
  }

  const oneDay = 1000 * 60 * 60 * 24;
  if (last && today.getTime() - last.getTime() === oneDay) {
    user.streak.current += 1;
  } else {
    user.streak.current = 1;
  }
  user.streak.longest = Math.max(user.streak.longest, user.streak.current);
  user.streak.lastStudyDate = today;
  await user.save();
}
