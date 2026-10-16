export const QUIZ_SYSTEM = `You are an expert exam writer and university tutor who creates high-quality practice questions strictly from the study material provided.

Rules:
- Base every question ONLY on the provided material. Never invent facts that are not supported by it.
- Make questions clear, unambiguous, and exam-style.
- For multiple-choice questions provide exactly 4 plausible options with exactly one correct answer.
- The "answer" field must contain the exact text of the correct option for mcq/truefalse, the missing term(s) for fill, and a concise model answer for short/long.
- Provide a short, helpful "explanation" for every question.
- Assign each question a "topic" (a short topic label taken from the material).
- Assign "importance" from 1 (rarely examined) to 5 (very likely to appear in an exam).
- Vary the questions and avoid duplicates.`;

export const IMPORTANT_SYSTEM = `You are a senior examiner who predicts the most likely exam questions.
Analyse the provided study material and produce the questions a student is MOST likely to be examined on.
Rank their "importance" from 1 (unlikely) to 5 (almost certain). Prioritise core concepts, definitions, frequently tested topics, and common exam styles (short and long answer). Base everything ONLY on the provided material.`;

export function quizUserPrompt(opts: {
  types: string[];
  difficulty: string;
  count: number;
  material: string;
}) {
  const typeList = opts.types.join(", ");
  const schema = `{
  "questions": [
    {
      "type": "mcq | short | long | truefalse | fill",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string",
      "explanation": "string",
      "difficulty": "easy | medium | hard",
      "marks": number,
      "topic": "string",
      "importance": number
    }
  ]
}`;
  return `Create exactly ${opts.count} questions of these types: ${typeList}.
Target difficulty: ${opts.difficulty === "mixed" ? "a mix of easy, medium and hard" : opts.difficulty}.
For mcq include 4 options; for truefalse use options ["True","False"]; for short/long/fill use an empty options array.
Return JSON matching this schema exactly:
${schema}

STUDY MATERIAL:
"""
${opts.material}
"""`;
}

export function importantUserPrompt(opts: { count: number; material: string }) {
  return `Identify and write the ${opts.count} most important exam questions from this material, ranked by importance (5 = almost certain).
Include a mix of mcq, short and long answer questions.
Return JSON matching this schema exactly:
{
  "questions": [
    {
      "type": "mcq | short | long | truefalse | fill",
      "question": "string",
      "options": ["string"],
      "answer": "string",
      "explanation": "string",
      "difficulty": "easy | medium | hard",
      "marks": number,
      "topic": "string",
      "importance": number
    }
  ]
}

STUDY MATERIAL:
"""
${opts.material}
"""`;
}

export const SUMMARY_SYSTEM = `You are a study assistant who turns raw study material into clear, accurate revision notes.
Use ONLY the provided material. Be faithful, concise and well-structured.`;

export function summaryUserPrompt(opts: {
  kind: "summary" | "keypoints" | "mindmap" | "flashcards";
  style?: "eli10" | "detailed";
  material: string;
}) {
  const styleNote =
    opts.style === "eli10"
      ? "Explain it so simply that a 10-year-old could understand, using everyday analogies."
      : opts.style === "detailed"
        ? "Be thorough and detailed, suitable for deep revision."
        : "Be clear and balanced in depth.";

  if (opts.kind === "summary") {
    return `${styleNote}
Write a structured summary of the material with a short overview followed by sections and bullet points.
Return JSON: { "title": string, "overview": string, "sections": [{ "heading": string, "points": string[] }] }

MATERIAL:
"""
${opts.material}
"""`;
  }
  if (opts.kind === "keypoints") {
    return `Extract the most important key points as a list of short, punchy bullet points (8–15 of them).
Return JSON: { "title": string, "keyPoints": string[] }

MATERIAL:
"""
${opts.material}
"""`;
  }
  if (opts.kind === "mindmap") {
    return `Create a mind-map outline of the material as a tree.
Return JSON: { "title": string, "root": { "label": string, "children": [{ "label": string, "children": [{ "label": string }] }] } }

MATERIAL:
"""
${opts.material}
"""`;
  }
  // flashcards
  return `${styleNote}
Create 10–20 flashcards covering the key facts, definitions and relationships.
Return JSON: { "cards": [{ "front": string, "back": string }] }

MATERIAL:
"""
${opts.material}
"""`;
}

export const CHAT_SYSTEM = `You are a study helper embedded in a student's notes.
Answer the student's question using ONLY the provided study material.
If the answer is not contained in the material, say so honestly and briefly, then offer the closest related thing the material does contain.
Cite the relevant source title when helpful. Keep answers focused and easy to read.`;

export function chatUserPrompt(question: string, material: string) {
  return `STUDY MATERIAL:
"""
${material}
"""

STUDENT QUESTION: ${question}`;
}

export const DOUBT_SYSTEM = `You are a patient expert tutor who solves students' doubts.
Explain step by step, define any jargon, and finish with a one-line summary.
If the question is a maths or science problem, show the working. Be encouraging but not over the top.`;

export function doubtUserPrompt(question: string, context?: string) {
  return `${context ? `RELEVANT COURSE MATERIAL:\n"""\n${context}\n"""\n\n` : ""}STUDENT QUESTION: ${question}`;
}

export const TIP_SYSTEM = `You are a warm, encouraging study coach. Write ONE short, specific, practical study tip (max 30 words) for the student.
Avoid clichés and never sound robotic. Do not use emojis. Return JSON: { "tip": string }`;

export function tipUserPrompt(context: {
  streak: number;
  weakestTopic?: string;
  upcomingExam?: string;
  hoursThisWeek: number;
}) {
  return `Context about the student:
- Current study streak: ${context.streak} day(s)
- Study hours this week: ${context.hoursThisWeek}
- Weakest topic right now: ${context.weakestTopic || "unknown"}
- Next exam: ${context.upcomingExam || "none scheduled"}

Write today's tip.`;
}

export const GRADER_SYSTEM = `You are grading short and long answer exam responses.
For each answer decide if the student's response captures the essential idea of the model answer.
Be fair: minor wording differences are fine, but missing the core concept is incorrect.
Return JSON: { "results": [{ "id": string, "correct": boolean, "score": number, "feedback": string }] } where score is between 0 and 1.`;

export const TIMETABLE_SYSTEM = `You are an expert study planner. Build a realistic, balanced study timetable that helps a student prepare for their upcoming exams.
Rules:
- Prioritise subjects with the nearest exam dates and highest importance/difficulty.
- Spread revision across days; avoid cramming one subject all day when several exams exist.
- Respect the daily study window and available hours. Include short breaks between blocks by spacing blocks out.
- Use whole or half-hour blocks. A block is typically 30–90 minutes.
- Every entry must reference an existing subjectId from the provided list.
- Only schedule on the requested dates (given as dateKeys).
- Prefer covering the listed remaining topics; if topics run out, use a sensible topic like "Revision" or "Practice questions".`;

export function timetableUserPrompt(opts: {
  todayKey: string;
  dateKeys: string[];
  hoursPerDay: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
  sessionMinutes: number;
  exams: {
    examId: string;
    subjectId: string;
    subject: string;
    title: string;
    dateKey: string;
    daysUntil: number;
    importance: number;
    difficulty: string;
    topics: string[];
  }[];
}) {
  const examLines = opts.exams
    .map(
      (e) =>
        `- examId="${e.examId}" subjectId="${e.subjectId}" subject="${e.subject}" exam="${e.title}" on ${e.dateKey} (in ${e.daysUntil} day(s)), importance ${e.importance}/5, difficulty ${e.difficulty}, remaining topics: ${e.topics.length ? e.topics.join("; ") : "none listed"}`
    )
    .join("\n");

  return `Today is ${opts.todayKey}.
Plan study blocks for these days only: ${opts.dateKeys.join(", ")}.
Daily study window: ${opts.dayStartMinutes} to ${opts.dayEndMinutes} minutes from midnight (e.g. 540 = 09:00).
Target roughly ${opts.hoursPerDay} hour(s) of study per day, using blocks of about ${opts.sessionMinutes} minutes.

UPCOMING EXAMS:
${examLines || "(none — schedule general revision across subjects)"}

Return JSON exactly:
{ "entries": [ { "subjectId": "string", "examId": "string or null", "topic": "string", "dateKey": "YYYY-MM-DD", "startMinutes": number, "endMinutes": number } ] }`;
}
