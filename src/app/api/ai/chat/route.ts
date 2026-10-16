import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { chatSchema } from "@/lib/validators";
import { getMaterialContext } from "@/lib/queries";
import { gatherMaterialText } from "@/lib/text";
import { callClaude, aiConfigured } from "@/lib/ai";
import { CHAT_SYSTEM, chatUserPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`chat:${userId}`, 20, 60_000);
  if (!limit.success) return fail("Too many messages. Please slow down.", 429);
  if (!aiConfigured()) {
    return fail(
      "AI is not configured on this server. Add ANTHROPIC_API_KEY to enable chat.",
      503
    );
  }

  const input = await parseJson(req, chatSchema);
  await connectDB();

  const subject = await Subject.findOne({ _id: input.subjectId, userId });
  if (!subject) return fail("Subject not found.", 404);

  const materials = await getMaterialContext(userId, {
    subjectId: input.subjectId,
    chapterIds: input.chapterIds,
    materialIds: input.materialIds,
  });
  if (materials.length === 0) {
    return fail(
      "No study material found for this selection. Upload a material first.",
      400
    );
  }

  const materialText = gatherMaterialText(materials, 36000);
  const answer = await callClaude({
    system: CHAT_SYSTEM,
    messages: [
      { role: "user", content: chatUserPrompt(input.question, materialText) },
    ],
    maxTokens: 1500,
    temperature: 0.3,
  });

  return ok({ answer });
});
