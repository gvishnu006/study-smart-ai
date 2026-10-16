"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Wand2, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { ChapterDTO, QuestionDTO, SubjectDTO } from "@/types/app";

const TYPES = [
  { id: "mcq", label: "MCQ" },
  { id: "short", label: "Short answer" },
  { id: "long", label: "Long answer" },
  { id: "truefalse", label: "True / False" },
  { id: "fill", label: "Fill in the blank" },
] as const;

interface GeneratedQuiz {
  _id: string;
  title: string;
  mode: "practice" | "quiz" | "important";
  subjectName?: string;
  subjectColor?: string;
  questions: QuestionDTO[];
}

export function GeneratePanel({
  subjects,
  chapters,
  onGenerated,
  onError,
}: {
  subjects: SubjectDTO[];
  chapters: ChapterDTO[];
  onGenerated: (quiz: GeneratedQuiz) => void;
  onError?: () => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?._id ?? "");
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>(["mcq"]);
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(10);
  const [byType, setByType] = useState(false);
  const [important, setImportant] = useState(false);
  const [loading, setLoading] = useState(false);

  const subjectChapters = useMemo(
    () => chapters.filter((c) => c.subjectId === subjectId),
    [chapters, subjectId]
  );

  function toggleChapter(id: string) {
    setChapterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleType(id: string) {
    setTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function generate() {
    if (!subjectId) {
      toast.error("Choose a subject first.");
      return;
    }
    if (!important && types.length === 0) {
      toast.error("Select at least one question type.");
      return;
    }
    setLoading(true);
    try {
      const quiz = await apiPost<GeneratedQuiz>("/api/ai/generate-quiz", {
        subjectId,
        chapterIds,
        materialIds: [],
        types: important ? ["mcq", "short", "long"] : types,
        difficulty,
        count,
        marksType: byType ? "byType" : "equal",
        mode: important ? "important" : "quiz",
      });
      toast.success(`Generated ${quiz.questions.length} questions.`);
      onGenerated(quiz);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
      onError?.();
    } finally {
      setLoading(false);
    }
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Add a subject and upload some material first — then generate a quiz.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Generate from your material</h2>
            <p className="text-xs text-muted-foreground">
              The AI writes questions using only what you uploaded.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select
              value={subjectId}
              onValueChange={(v) => {
                setSubjectId(v);
                setChapterIds([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Number of questions</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
              }
            />
          </div>
        </div>

        {subjectChapters.length > 0 ? (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" /> Chapters{" "}
              <span className="font-normal text-muted-foreground">
                (all if none selected)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {subjectChapters.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => toggleChapter(c._id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    chapterIds.includes(c._id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "rounded-xl border border-accent/30 bg-accent/5 p-4 transition-opacity",
            important && "ring-1 ring-accent"
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-semibold">Important Questions mode</Label>
              <p className="text-xs text-muted-foreground">
                AI predicts the most likely exam questions, ranked by importance.
              </p>
            </div>
            <Switch checked={important} onCheckedChange={setImportant} aria-label="Important questions mode" />
          </div>
        </div>

        <div className={cn("space-y-4", important && "pointer-events-none opacity-40")}>
          <div className="space-y-2">
            <Label>Question types</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleType(t.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    types.includes(t.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm">Marks by type</span>
                <Switch checked={byType} onCheckedChange={setByType} aria-label="Marks by type" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{count} questions</Badge>
            {important ? (
              <Badge variant="accent">Important</Badge>
            ) : (
              types.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))
            )}
          </div>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate quiz
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
