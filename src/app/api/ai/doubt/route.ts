import { connectDB } from "@/lib/db";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { doubtSchema } from "@/lib/validators";
import { getMaterialContext } from "@/lib/queries";
import { gatherMaterialText } from "@/lib/text";
import { callClaude, aiConfigured } from "@/lib/ai";
import { DOUBT_SYSTEM, doubtUserPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`doubt:${userId}`, 20, 60_000);
  if (!limit.success) return fail("Too many questions. Please slow down.", 429);
  if (!aiConfigured()) {
    return fail(
      "AI is not configured on this server. Add ANTHROPIC_API_KEY to enable the doubt solver.",
      503
    );
  }

  const input = await parseJson(req, doubtSchema);
  await connectDB();

  let context = "";
  if (input.subjectId) {
    const materials = await getMaterialContext(userId, {
      subjectId: input.subjectId,
      chapterIds: [],
      materialIds: [],
    });
    context = gatherMaterialText(materials, 24000);
  }

  const answer = await callClaude({
    system: DOUBT_SYSTEM,
    messages: [
      { role: "user", content: doubtUserPrompt(input.question, context || undefined) },
    ],
    maxTokens: 2000,
    temperature: 0.3,
  });

  return ok({ answer });
});
