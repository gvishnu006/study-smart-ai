import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI is not configured. Add ANTHROPIC_API_KEY to your environment variables to enable AI features."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callClaude({
  system,
  messages,
  maxTokens = 2000,
  temperature = 0.4,
}: {
  system: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const anthropic = getAnthropic();
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return res.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

/** Extract the first JSON value (object or array) from a model response. */
export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim();
  text = text.replace(/```json/gi, "```").replace(/```/g, "").trim();

  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  let start = -1;
  let closeChar = "}";
  if (firstObj === -1 && firstArr === -1) {
    throw new Error("The AI response did not contain valid JSON.");
  }
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    closeChar = "]";
  } else {
    start = firstObj;
  }

  const end = text.lastIndexOf(closeChar);
  if (end === -1 || end < start) {
    throw new Error("The AI response contained malformed JSON.");
  }
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    // Fallback: attempt to repair common trailing-comma issues.
    const repaired = slice.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired) as T;
  }
}

export async function callClaudeJson<T>(opts: {
  system: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const raw = await callClaude({
    ...opts,
    system:
      opts.system +
      "\n\nIMPORTANT: Respond with valid JSON only. No markdown fences, no commentary before or after the JSON.",
  });
  return extractJson<T>(raw);
}

export { MODEL };
