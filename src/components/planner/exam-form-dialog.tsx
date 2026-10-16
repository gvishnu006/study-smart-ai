"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPatch, apiPost } from "@/lib/fetcher";
import type { ExamDTO } from "@/types/app";

function toInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExamFormDialog({
  open,
  onOpenChange,
  exam,
  subjects,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exam?: ExamDTO | null;
  subjects: { _id: string; name: string; color: string }[];
  onSaved: () => void;
}) {
  const [subjectId, setSubjectId] = useState(exam?.subjectId ?? subjects[0]?._id ?? "");
  const [title, setTitle] = useState(exam?.title ?? "");
  const [examDate, setExamDate] = useState(toInputValue(exam?.examDate));
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    exam?.difficulty ?? "medium"
  );
  const [importance, setImportance] = useState(exam?.importance ?? 3);
  const [topics, setTopics] = useState<string[]>(
    exam?.syllabusTopics?.map((t) => t.name) ?? []
  );
  const [topicInput, setTopicInput] = useState("");
  const [notes, setNotes] = useState(exam?.notes ?? "");
  const [saving, setSaving] = useState(false);

  function addTopic() {
    const value = topicInput.trim();
    if (!value) return;
    setTopics((prev) => [...prev, value]);
    setTopicInput("");
  }

  async function save() {
    if (!title.trim()) {
      toast.error("Enter an exam title.");
      return;
    }
    if (!examDate) {
      toast.error("Choose the exam date.");
      return;
    }
    setSaving(true);
    try {
      const existing = new Map(
        (exam?.syllabusTopics ?? []).map((t) => [t.name, t] as const)
      );
      const body = {
        subjectId,
        title: title.trim(),
        examDate: new Date(examDate).toISOString(),
        difficulty,
        importance,
        syllabusTopics: topics.map((name) => ({
          name,
          done: existing.get(name)?.done ?? false,
          weight: existing.get(name)?.weight ?? 1,
        })),
        notes,
      };
      if (exam) {
        await apiPatch(`/api/exams/${exam._id}`, body);
        toast.success("Exam updated.");
      } else {
        await apiPost("/api/exams", body);
        toast.success("Exam added.");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save exam.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exam ? "Edit exam" : "Add exam"}</DialogTitle>
          <DialogDescription>
            Add your exams so the planner can build a timetable around them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="exam-title">Exam title</Label>
              <Input
                id="exam-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm 2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exam-date">Date &amp; time</Label>
              <Input
                id="exam-date"
                type="datetime-local"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) =>
                  setDifficulty(v as "easy" | "medium" | "hard")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Importance</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setImportance(n)}
                  className={
                    "h-9 flex-1 rounded-lg border text-sm font-medium transition-colors " +
                    (importance === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Syllabus topics</Label>
            <div className="flex gap-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTopic();
                  }
                }}
                placeholder="Add a topic and press Enter"
              />
              <Button type="button" variant="outline" onClick={addTopic}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {topics.length > 0 ? (
              <ul className="flex flex-wrap gap-2 pt-1">
                {topics.map((t, i) => (
                  <li
                    key={`${t}-${i}`}
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove ${t}`}
                      onClick={() =>
                        setTopics((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-notes">Notes (optional)</Label>
            <Textarea
              id="exam-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything to remember about this exam"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : exam ? "Save changes" : "Add exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
