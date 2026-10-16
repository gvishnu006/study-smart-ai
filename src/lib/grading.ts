import { callClaudeJson, aiConfigured } from "@/lib/ai";
import { GRADER_SYSTEM } from "@/lib/prompts";
import type { QuestionType } from "@/models/Question";

export function normalizeAnswer(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "was", "were",
  "be", "as", "by", "for", "with", "on", "at", "it", "that", "this", "from",
  "which", "there", "their", "its", "into", "using", "used", "can", "will",
]);

function keywords(s: string) {
  return normalizeAnswer(s)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Local fallback: does the student's response cover enough of the model answer's keywords? */
export function fuzzyGrade(response: string, answer: string): boolean {
  const resp = normalizeAnswer(response);
  const ans = normalizeAnswer(answer);
  if (!resp) return false;
  if (resp === ans) return true;
  if (ans.length > 3 && resp.includes(ans)) return true;

  const keys = keywords(answer);
  if (keys.length === 0) return resp.length > 0;
  const respSet = new Set(keywords(response));
  const hits = keys.filter((k) => respSet.has(k) || resp.includes(k)).length;
  return hits / keys.length >= 0.5;
}

export function isObjective(type: QuestionType) {
  return type === "mcq" || type === "truefalse" || type === "fill";
}

export function gradeObjective(
  type: QuestionType,
  response: string,
  answer: string
): boolean {
  const r = normalizeAnswer(response);
  const a = normalizeAnswer(answer);
  if (!r) return false;
  if (type === "fill") {
    // accept if the response contains the key missing term
    return r === a || r.includes(a) || a.includes(r);
  }
  return r === a;
}

export interface GradeItem {
  id: string;
  type: QuestionType;
  response: string;
  answer: string;
  explanation: string;
}

export interface GradeResult {
  id: string;
  correct: boolean;
  feedback?: string;
}

/**
 * Grade a mixed set of answers. Objective items are graded locally (instant,
 * deterministic). Subjective items are graded by the AI in a single call, with
 * a keyword-overlap fallback when the AI is unavailable.
 */
export async function gradeAnswers(items: GradeItem[]): Promise<GradeResult[]> {
  const results: GradeResult[] = [];
  const subjective: GradeItem[] = [];

  for (const item of items) {
    if (isObjective(item.type)) {
      results.push({
        id: item.id,
        correct: gradeObjective(item.type, item.response, item.answer),
      });
    } else {
      subjective.push(item);
    }
  }

  if (subjective.length === 0) return results;

  if (aiConfigured()) {
    try {
      const payload = subjective.map((s) => ({
        id: s.id,
        type: s.type,
        question_response: s.response,
        model_answer: s.answer,
        explanation: s.explanation,
      }));
      const ai = await callClaudeJson<{
        results?: { id: string; correct: boolean; score?: number; feedback?: string }[];
      }>({
        system: GRADER_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Grade these responses. Return JSON.\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
        maxTokens: 2000,
        temperature: 0.2,
      });
      const map = new Map((ai.results || []).map((r) => [String(r.id), r]));
      for (const s of subjective) {
        const r = map.get(s.id);
        if (r) {
          results.push({
            id: s.id,
            correct: Boolean(r.correct) || (r.score ?? 0) >= 0.6,
            feedback: r.feedback,
          });
        } else {
          results.push({
            id: s.id,
            correct: fuzzyGrade(s.response, s.answer),
          });
        }
      }
      return results;
    } catch {
      // fall through to fuzzy
    }
  }

  for (const s of subjective) {
    results.push({ id: s.id, correct: fuzzyGrade(s.response, s.answer) });
  }
  return results;
}
