"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Timer, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost } from "@/lib/fetcher";
import type { QuestionDTO, SubjectDTO } from "@/types/app";

export const QUICK_QUIZ_SECONDS = 5 * 60;
const QUICK_QUIZ_COUNT = 5;

interface GeneratedQuiz {
  _id: string;
  title: string;
  subjectName?: string;
  subjectColor?: string;
  questions: QuestionDTO[];
}

export function QuickQuizDialog({
  subjects,
  open,
  onOpenChange,
  onGenerated,
}: {
  subjects: SubjectDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (quiz: GeneratedQuiz) => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?._id ?? "");
  const [difficulty, setDifficulty] = useState("mixed");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !subjectId && subjects[0]) setSubjectId(subjects[0]._id);
  }, [open, subjectId, subjects]);

  async function start() {
    if (!subjectId) {
      toast.error("Choose a subject first.");
      return;
    }
    setLoading(true);
    try {
      const quiz = await apiPost<GeneratedQuiz>("/api/ai/generate-quiz", {
        subjectId,
        chapterIds: [],
        materialIds: [],
        types: ["mcq", "truefalse"],
        difficulty,
        count: QUICK_QUIZ_COUNT,
        marksType: "equal",
        mode: "practice",
        title: "5-minute challenge",
      });
      onOpenChange(false);
      onGenerated(quiz);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the challenge.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <DialogTitle>5-minute challenge</DialogTitle>
          <DialogDescription>
            {QUICK_QUIZ_COUNT} rapid-fire multiple choice and true/false questions.
            You have five minutes — the quiz submits itself when time runs out.
          </DialogDescription>
        </DialogHeader>

        {subjects.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Add a subject and upload material first, then come back for a quick
            challenge.
          </p>
        ) : (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
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
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={start} disabled={loading || subjects.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
              </>
            ) : (
              <>
                <Timer className="h-4 w-4" /> Start 5-min quiz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
