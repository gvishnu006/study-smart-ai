import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Flashcard from "@/models/Flashcard";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { summarizeSchema } from "@/lib/validators";
import { getMaterialContext } from "@/lib/queries";
import { gatherMaterialText } from "@/lib/text";
import { callClaudeJson, aiConfigured } from "@/lib/ai";
import { SUMMARY_SYSTEM, summaryUserPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`summarize:${userId}`, 15, 60_000);
  if (!limit.success) return fail("Too many requests. Please wait a moment.", 429);
  if (!aiConfigured()) {
    return fail(
      "AI is not configured on this server. Add ANTHROPIC_API_KEY to enable this feature.",
      503
    );
  }

  const input = await parseJson(req, summarizeSchema);
  await connectDB();

  const subject = await Subject.findOne({ _id: input.subjectId, userId });
  if (!subject) return fail("Subject not found.", 404);

  const materials = await getMaterialContext(userId, {
    subjectId: input.subjectId,
    chapterIds: input.chapterIds,
    materialIds: input.materialIds,
  });
  if (materials.length === 0) {
    return fail("No study material found for this selection.", 400);
  }

  const materialText = gatherMaterialText(materials, 40000);

  if (input.kind === "flashcards") {
    const data = await callClaudeJson<{
      cards?: { front?: string; back?: string }[];
    }>({
      system: SUMMARY_SYSTEM,
      messages: [
        { role: "user", content: summaryUserPrompt({ kind: "flashcards", style: input.style, material: materialText }) },
      ],
      maxTokens: 3000,
      temperature: 0.4,
    });
    const cards = (data.cards || [])
      .filter((c) => c.front && c.back)
      .map((c) => ({ front: String(c.front), back: String(c.back) }));

    if (cards.length > 0) {
      await Flashcard.insertMany(
        cards.map((c) => ({
          userId: new Types.ObjectId(userId),
          subjectId: new Types.ObjectId(input.subjectId),
          chapterId: input.chapterIds[0] ? new Types.ObjectId(input.chapterIds[0]) : null,
          materialId: input.materialIds[0] ? new Types.ObjectId(input.materialIds[0]) : null,
          front: c.front.slice(0, 500),
          back: c.back.slice(0, 1500),
        }))
      );
    }
    return ok({ kind: "flashcards", cards });
  }

  const data = await callClaudeJson<Record<string, unknown>>({
    system: SUMMARY_SYSTEM,
    messages: [
      {
        role: "user",
        content: summaryUserPrompt({
          kind: input.kind,
          style: input.style,
          material: materialText,
        }),
      },
    ],
    maxTokens: 3000,
    temperature: 0.4,
  });

  return ok({ kind: input.kind, ...data });
});
