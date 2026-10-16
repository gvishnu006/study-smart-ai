"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ListChecks,
  History,
  TrendingDown,
  Play,
  Trash2,
  Trophy,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GeneratePanel } from "@/components/quiz/generate-panel";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import {
  QuickQuizDialog,
  QUICK_QUIZ_SECONDS,
} from "@/components/quiz/quick-quiz-dialog";
import { apiDelete, apiFetch } from "@/lib/fetcher";
import { formatClock } from "@/lib/utils";
import type {
  AttemptDTO,
  ChapterDTO,
  QuestionDTO,
  QuizDTO,
  SubjectDTO,
} from "@/types/app";

interface Props {
  subjects: SubjectDTO[];
  chapters: ChapterDTO[];
  initialQuizzes: QuizDTO[];
  initialAttempts: AttemptDTO[];
  quickMode?: boolean;
}

type RunningQuiz = {
  _id: string;
  title: string;
  subjectName?: string;
  subjectColor?: string;
  questions: QuestionDTO[];
  timeLimitSeconds?: number;
};

export function QuizView({
  subjects,
  chapters,
  initialQuizzes,
  initialAttempts,
  quickMode = false,
}: Props) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [running, setRunning] = useState<RunningQuiz | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizDTO | null>(null);
  const [quickOpen, setQuickOpen] = useState(quickMode);

  const weakTopics = useMemo(() => {
    const map = new Map<string, { subject: string; misses: number }>();
    for (const a of attempts) {
      for (const t of a.weakTopics) {
        const key = `${t}|${a.subjectName ?? ""}`;
        const cur = map.get(key) ?? { subject: a.subjectName ?? "", misses: 0 };
        cur.misses += 1;
        map.set(key, cur);
      }
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ topic: key.split("|")[0], ...v }))
      .sort((a, b) => b.misses - a.misses)
      .slice(0, 12);
  }, [attempts]);

  async function refreshLists() {
    try {
      const [q, a] = await Promise.all([
        apiFetch<QuizDTO[]>("/api/quizzes"),
        apiFetch<AttemptDTO[]>("/api/quiz-attempts"),
      ]);
      setQuizzes(q);
      setAttempts(a);
    } catch {
      /* ignore */
    }
  }

  async function startQuiz(id: string) {
    setLoadingId(id);
    try {
      const quiz = await apiFetch<RunningQuiz>(`/api/quizzes/${id}`);
      setRunning(quiz);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load the quiz.");
    } finally {
      setLoadingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/quizzes/${deleteTarget._id}`);
      setQuizzes((p) => p.filter((q) => q._id !== deleteTarget._id));
      toast.success("Quiz deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleteTarget(null);
    }
  }

  if (running) {
    return (
      <QuizRunner
        quiz={running}
        timeLimitSeconds={running.timeLimitSeconds}
        onExit={() => {
          setRunning(null);
          refreshLists();
        }}
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Short on time? Take a 5-minute challenge and earn XP fast.
        </p>
        <Button
          variant="accent"
          size="sm"
          onClick={() => setQuickOpen(true)}
          disabled={subjects.length === 0}
        >
          <Zap className="h-4 w-4" /> 5-min quiz
        </Button>
      </div>
    <Tabs defaultValue="generate">
      <TabsList className="flex-wrap">
        <TabsTrigger value="generate">
          <ListChecks className="mr-1.5 h-4 w-4" /> Generate
        </TabsTrigger>
        <TabsTrigger value="quizzes">
          My quizzes
          {quizzes.length ? (
            <Badge variant="secondary" className="ml-2">
              {quizzes.length}
            </Badge>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="history">
          <History className="mr-1.5 h-4 w-4" /> History
        </TabsTrigger>
        <TabsTrigger value="weak">
          <TrendingDown className="mr-1.5 h-4 w-4" /> Weak topics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="generate">
        <GeneratePanel
          subjects={subjects}
          chapters={chapters}
          onGenerated={(quiz) => {
            setRunning(quiz);
            refreshLists();
          }}
        />
      </TabsContent>

      <TabsContent value="quizzes">
        {quizzes.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No quizzes yet"
            description="Generate your first quiz from your uploaded material."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((q) => (
              <Card key={q._id} className="transition-shadow hover:shadow-card">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={q.title}>
                        {q.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {q.questionIds.length} questions ·{" "}
                        {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ background: q.subjectColor }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.mode === "important" ? (
                      <Badge variant="accent">Important</Badge>
                    ) : (
                      <Badge variant="secondary">{q.subjectName}</Badge>
                    )}
                    {q.attemptCount ? (
                      <Badge variant="outline">
                        <Trophy className="mr-1 h-3 w-3" /> Best {q.bestScore}%
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not attempted</Badge>
                    )}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => startQuiz(q._id)}
                      disabled={loadingId === q._id}
                    >
                      {loadingId === q._id ? (
                        "Loading…"
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" /> Start
                        </>
                      )}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete quiz"
                      onClick={() => setDeleteTarget(q)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history">
        {attempts.length === 0 ? (
          <EmptyState
            icon={History}
            title="No attempts yet"
            description="Take a quiz and your results will appear here."
          />
        ) : (
          <div className="space-y-2.5">
            {attempts.map((a) => (
              <Card key={a._id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white"
                    style={{
                      background:
                        a.percentage >= 80
                          ? "#16a34a"
                          : a.percentage >= 50
                            ? "#f59e0b"
                            : "#e11d48",
                    }}
                  >
                    {a.percentage}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{a.subjectName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatClock(a.durationSeconds)}
                      </span>
                      <span>
                        {new Date(a.completedAt).toLocaleDateString()}
                      </span>
                    </p>
                    {a.weakTopics.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {a.weakTopics.slice(0, 4).map((t) => (
                          <Badge key={t} variant="destructive">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="w-32">
                    <Progress value={a.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="weak">
        {weakTopics.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No weak topics detected"
            description="As you take quizzes, topics you struggle with will surface here so you know exactly what to revise first."
          />
        ) : (
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                These topics have the most missed questions. Revise them first for
                the biggest score gains.
              </p>
              {weakTopics.map((t, i) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.topic}</p>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                  <Badge variant="destructive">{t.misses} misses</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              The quiz and its questions will be removed. Past attempt history is
              kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
      <QuickQuizDialog
        subjects={subjects}
        open={quickOpen}
        onOpenChange={setQuickOpen}
        onGenerated={(quiz) => {
          setRunning({ ...quiz, timeLimitSeconds: QUICK_QUIZ_SECONDS });
          refreshLists();
        }}
      />
    </>
  );
}
