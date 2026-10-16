"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleCheck,
  CircleX,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  Trophy,
  Sparkles,
  RefreshCw,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { fireConfetti, formatClock, cn } from "@/lib/utils";
import { apiPost } from "@/lib/fetcher";
import type { QuestionDTO } from "@/types/app";

interface AttemptResult {
  score: number;
  totalMarks: number;
  percentage: number;
  durationSeconds: number;
  weakTopics: string[];
  strongTopics: string[];
  results: { questionId: string; correct: boolean; response: string }[];
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function objectiveCorrect(type: string, response: string, answer: string) {
  const r = normalize(response);
  const a = normalize(answer);
  if (!r) return false;
  if (type === "fill") return r === a || r.includes(a) || a.includes(r);
  return r === a;
}

const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple choice",
  truefalse: "True / False",
  fill: "Fill in the blank",
  short: "Short answer",
  long: "Long answer",
};

export function QuizRunner({
  quiz,
  onExit,
  timeLimitSeconds,
}: {
  quiz: {
    _id: string;
    title: string;
    subjectName?: string;
    subjectColor?: string;
    questions: QuestionDTO[];
  };
  onExit: () => void;
  timeLimitSeconds?: number;
}) {
  const questions = quiz.questions;
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [started, setStarted] = useState(false);
  const startRef = useRef<number>(Date.now());
  const questionTimes = useRef<Record<string, number>>({});
  const qEnteredAt = useRef<number>(Date.now());
  const autoSubmitted = useRef(false);

  const current = questions[index];
  const totalMarks = useMemo(
    () => questions.reduce((s, q) => s + q.marks, 0),
    [questions]
  );
  const answeredCount = Object.keys(responses).length;
  const remaining =
    timeLimitSeconds != null ? Math.max(0, timeLimitSeconds - elapsed) : null;

  useEffect(() => {
    if (!started || result) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [started, result]);

  useEffect(() => {
    if (!timeLimitSeconds || !started || result || autoSubmitted.current) return;
    if (elapsed >= timeLimitSeconds) {
      autoSubmitted.current = true;
      toast("Time's up — submitting your answers.");
      void finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, timeLimitSeconds, started, result]);

  useEffect(() => {
    qEnteredAt.current = Date.now();
  }, [index]);

  function commitTime(qid: string) {
    const spent = Math.round((Date.now() - qEnteredAt.current) / 1000);
    questionTimes.current[qid] = (questionTimes.current[qid] ?? 0) + spent;
    qEnteredAt.current = Date.now();
  }

  function setResponse(qid: string, value: string) {
    setResponses((p) => ({ ...p, [qid]: value }));
  }

  function chooseOption(q: QuestionDTO, option: string) {
    if (revealed[q._id]) return;
    commitTime(q._id);
    setResponse(q._id, option);
    if (q.type === "mcq" || q.type === "truefalse") {
      setRevealed((p) => ({ ...p, [q._id]: true }));
    }
  }

  async function finish() {
    setSubmitting(true);
    try {
      const answers = questions
        .filter((q) => responses[q._id] !== undefined)
        .map((q) => ({
          questionId: q._id,
          response: responses[q._id] ?? "",
          timeSpentSeconds: questionTimes.current[q._id] ?? 0,
        }));
      const data = await apiPost<AttemptResult>("/api/quiz-attempts", {
        quizId: quiz._id,
        durationSeconds: Math.floor((Date.now() - startRef.current) / 1000),
        answers,
      });
      setResult(data);
      if (data.percentage >= 80) {
        setTimeout(() => fireConfetti({ count: 160 }), 150);
        toast.success("Outstanding! Keep it up.");
      } else if (data.percentage >= 50) {
        toast.success("Nice work — review your weak topics below.");
      } else {
        toast("Every attempt is progress. Review and try again.", {
          icon: "💪",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save attempt.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Start screen ----------
  if (!started) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white"
            style={{ background: quiz.subjectColor || "#0d9488" }}
          >
            <ListChecks className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{quiz.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {questions.length} questions · {totalMarks} marks
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(new Set(questions.map((q) => q.type))).map((t) => (
              <Badge key={t} variant="secondary">
                {TYPE_LABEL[t] ?? t}
              </Badge>
            ))}
          </div>
          <p className="max-w-md text-sm text-muted-foreground text-pretty">
            {timeLimitSeconds
              ? `You have ${Math.round(timeLimitSeconds / 60)} minutes. The quiz auto-submits when time runs out — move quickly and trust your first instinct.`
              : "Answer at your own pace. Multiple choice and true/false give instant feedback. Your score and weak topics are saved to your history."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onExit}>
              Back
            </Button>
            <Button
              onClick={() => {
                startRef.current = Date.now();
                qEnteredAt.current = Date.now();
                setElapsed(0);
                autoSubmitted.current = false;
                setStarted(true);
              }}
            >
              Start quiz <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------- Result screen ----------
  if (result) {
    const resultMap = new Map(result.results.map((r) => [r.questionId, r]));
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div
            className={cn(
              "p-8 text-center text-white",
              result.percentage >= 80
                ? "bg-gradient-to-br from-emerald-500 to-teal-700"
                : result.percentage >= 50
                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : "bg-gradient-to-br from-rose-500 to-red-700"
            )}
          >
            <Trophy className="mx-auto h-10 w-10 opacity-90" />
            <p className="mt-3 font-display text-4xl font-bold">
              {result.percentage}%
            </p>
            <p className="mt-1 text-white/85">
              {result.score} of {result.totalMarks} marks · in{" "}
              {formatClock(result.durationSeconds)}
            </p>
          </div>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">
                Strong topics
              </p>
              {result.strongTopics.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.strongTopics.map((t) => (
                    <Badge key={t} variant="success">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None yet.</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">
                Weak topics — revise these first
              </p>
              {result.weakTopics.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.weakTopics.map((t) => (
                    <Badge key={t} variant="destructive">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing flagged. Excellent.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const r = resultMap.get(q._id);
            const correct = r?.correct ?? false;
            return (
              <Card key={q._id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white",
                        correct ? "bg-success" : "bg-destructive"
                      )}
                    >
                      {correct ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <CircleX className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {i + 1}. {q.question}
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={correct ? "text-success" : "text-destructive"}>
                            {r?.response || "—"}
                          </span>
                        </p>
                        {!correct ? (
                          <p>
                            <span className="text-muted-foreground">Correct: </span>
                            <span className="text-success">{q.answer}</span>
                          </p>
                        ) : null}
                        {q.explanation ? (
                          <p className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                            {q.explanation}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <Badge variant="outline">{q.topic}</Badge>
                        <Badge variant="outline">{q.marks} marks</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 pb-4">
          <Button variant="outline" onClick={onExit}>
            Back to quizzes
          </Button>
          <Button
            onClick={() => {
              setResult(null);
              setResponses({});
              setRevealed({});
              setIndex(0);
              setElapsed(0);
              setStarted(false);
              questionTimes.current = {};
            }}
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Taking screen ----------
  const isRevealed = revealed[current._id];
  const isObjective = ["mcq", "truefalse"].includes(current.type);
  const localCorrect = isObjective
    ? objectiveCorrect(current.type, responses[current._id] ?? "", current.answer)
    : null;

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2 text-sm">
          <Clock
            className={cn(
              "h-4 w-4",
              remaining != null && remaining <= 60
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "font-medium tabular-nums",
              remaining != null && remaining <= 60 && "text-destructive"
            )}
          >
            {formatClock(remaining ?? elapsed)}
          </span>
          {remaining != null ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              left
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 items-center gap-3">
          <Progress
            value={(answeredCount / questions.length) * 100}
            className="h-1.5"
          />
          <span className="shrink-0 text-xs text-muted-foreground">
            {answeredCount}/{questions.length}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onExit}>
          Exit
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current._id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
        >
          <Card>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Question {index + 1} of {questions.length}
                </Badge>
                <Badge variant="outline">{TYPE_LABEL[current.type]}</Badge>
                <Badge variant="outline">{current.marks} marks</Badge>
                <Badge
                  variant={
                    current.difficulty === "hard"
                      ? "destructive"
                      : current.difficulty === "easy"
                        ? "success"
                        : "warning"
                  }
                >
                  {current.difficulty}
                </Badge>
              </div>

              <p className="font-display text-lg font-semibold leading-snug">
                {current.question}
              </p>

              {isObjective ? (
                <div className="grid gap-2.5">
                  {current.options.map((opt) => {
                    const selected = responses[current._id] === opt;
                    const isCorrectOpt =
                      normalize(opt) === normalize(current.answer);
                    return (
                      <motion.button
                        key={opt}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => chooseOption(current, opt)}
                        disabled={isRevealed}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                          isRevealed
                            ? isCorrectOpt
                              ? "border-success bg-success/10"
                              : selected
                                ? "border-destructive bg-destructive/10"
                                : "border-border opacity-60"
                            : selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-secondary"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                            isRevealed && isCorrectOpt
                              ? "border-success bg-success text-white"
                              : isRevealed && selected && !isCorrectOpt
                                ? "border-destructive bg-destructive text-white"
                                : "border-muted-foreground/40"
                          )}
                        >
                          {isRevealed && isCorrectOpt ? (
                            <Check className="h-3 w-3" />
                          ) : isRevealed && selected && !isCorrectOpt ? (
                            <CircleX className="h-3 w-3" />
                          ) : null}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    value={responses[current._id] ?? ""}
                    onChange={(e) => setResponse(current._id, e.target.value)}
                    placeholder="Type your answer…"
                    rows={current.type === "long" ? 6 : 3}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      commitTime(current._id);
                      setRevealed((p) => ({ ...p, [current._id]: true }));
                    }}
                    disabled={isRevealed}
                  >
                    <Sparkles className="h-4 w-4" /> Show model answer
                  </Button>
                </div>
              )}

              <AnimatePresence>
                {isRevealed ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={cn(
                        "rounded-xl border p-4",
                        localCorrect === false
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-success/30 bg-success/5"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {localCorrect === false ? (
                          <>
                            <CircleX className="h-4 w-4 text-destructive" /> Not quite
                          </>
                        ) : localCorrect === true ? (
                          <>
                            <CircleCheck className="h-4 w-4 text-success" /> Correct!
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-primary" /> Model answer
                          </>
                        )}
                      </div>
                      {!isObjective ? (
                        <p className="mt-2 text-sm">
                          <span className="text-muted-foreground">Answer: </span>
                          {current.answer}
                        </p>
                      ) : null}
                      {current.explanation ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {current.explanation}
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    commitTime(current._id);
                    setIndex((i) => Math.max(0, i - 1));
                  }}
                  disabled={index === 0}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                {index < questions.length - 1 ? (
                  <Button
                    onClick={() => {
                      commitTime(current._id);
                      setIndex((i) => i + 1);
                    }}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={finish} disabled={submitting}>
                    {submitting ? "Scoring…" : "Finish & score"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap justify-center gap-1.5 pb-4">
        {questions.map((q, i) => (
          <button
            key={q._id}
            aria-label={`Go to question ${i + 1}`}
            onClick={() => {
              commitTime(current._id);
              setIndex(i);
            }}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-semibold transition-colors",
              i === index
                ? "bg-primary text-primary-foreground"
                : responses[q._id] !== undefined
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
