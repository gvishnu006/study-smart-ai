import { connectDB } from "@/lib/db";
import StudySession from "@/models/StudySession";
import Exam from "@/models/Exam";
import User from "@/models/User";
import { apiHandler, ok } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { callClaudeJson, aiConfigured } from "@/lib/ai";
import { TIP_SYSTEM, tipUserPrompt } from "@/lib/prompts";
import { computeWeakTopics } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_TIPS = [
  "Try the 5-minute rule: commit to just five minutes. Starting is the hardest part, and momentum usually carries you further.",
  "Test yourself before you feel ready. Retrieval practice beats re-reading every single time.",
  "One topic at a time, phone in another room. Depth beats a scattered hour.",
  "End today's session by writing the three things you'd explain to a friend tomorrow.",
  "Space it out. A short review tomorrow is worth more than another hour tonight.",
];

export const GET = apiHandler(async () => {
  const userId = await requireUserId();
  await connectDB();

  const user = await User.findById(userId).lean();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [sessions, nextExam, weak] = await Promise.all([
    StudySession.find({ userId, startedAt: { $gte: weekStart } })
      .select("durationSeconds")
      .lean(),
    Exam.findOne({ userId, examDate: { $gte: new Date() } })
      .sort({ examDate: 1 })
      .populate("subjectId", "name")
      .lean(),
    computeWeakTopics(userId),
  ]);

  const hoursThisWeek =
    Math.round(
      (sessions.reduce((s, x) => s + x.durationSeconds, 0) / 3600) * 10
    ) / 10;

  const context = {
    streak: user?.streak?.current ?? 0,
    hoursThisWeek,
    weakestTopic: weak[0]?.topic,
    upcomingExam: nextExam
      ? `${(nextExam.subjectId as unknown as { name?: string })?.name ?? "Exam"} on ${new Date(nextExam.examDate).toLocaleDateString()}`
      : undefined,
  };

  if (!aiConfigured()) {
    const idx =
      (new Date().getDate() + context.streak) % FALLBACK_TIPS.length;
    return ok({ tip: FALLBACK_TIPS[idx], source: "curated" });
  }

  try {
    const data = await callClaudeJson<{ tip?: string }>({
      system: TIP_SYSTEM,
      messages: [{ role: "user", content: tipUserPrompt(context) }],
      maxTokens: 200,
      temperature: 0.8,
    });
    const tip = data.tip?.trim();
    if (tip) return ok({ tip, source: "ai" });
  } catch {
    /* fall through */
  }

  const idx = (new Date().getDate() + context.streak) % FALLBACK_TIPS.length;
  return ok({ tip: FALLBACK_TIPS[idx], source: "curated" });
});
