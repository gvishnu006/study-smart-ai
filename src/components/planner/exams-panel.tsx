"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarClock,
  GraduationCap,
  Pencil,
  Trash2,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
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
import { ExamFormDialog } from "@/components/planner/exam-form-dialog";
import { apiDelete, apiPatch } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { ExamDTO } from "@/types/app";

function urgencyClass(days: number) {
  if (days < 0) return "text-muted-foreground";
  if (days <= 7) return "text-destructive";
  if (days <= 21) return "text-warning";
  return "text-muted-foreground";
}

function countdownLabel(days: number) {
  if (days < 0) return "Completed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export function ExamsPanel({
  exams,
  subjects,
  onChanged,
}: {
  exams: ExamDTO[];
  subjects: { _id: string; name: string; color: string }[];
  onChanged: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamDTO | null>(null);
  const [deleting, setDeleting] = useState<ExamDTO | null>(null);

  async function toggleTopic(exam: ExamDTO, index: number) {
    const topics = exam.syllabusTopics.map((t, i) =>
      i === index ? { ...t, done: !t.done } : t
    );
    try {
      await apiPatch(`/api/exams/${exam._id}`, { syllabusTopics: topics });
      onChanged();
    } catch {
      toast.error("Could not update topic.");
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await apiDelete(`/api/exams/${deleting._id}`);
      toast.success("Exam removed.");
      setDeleting(null);
      onChanged();
    } catch {
      toast.error("Could not delete exam.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {exams.length} exam{exams.length === 1 ? "" : "s"} scheduled
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add exam
        </Button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No exams yet"
          description="Add your exams with dates and syllabus topics so the planner can prioritise your revision."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {exams.map((exam) => {
              const pct =
                exam.topicsTotal && exam.topicsTotal > 0
                  ? ((exam.topicsDone ?? 0) / exam.topicsTotal) * 100
                  : 0;
              const days = exam.daysUntil ?? 999;
              return (
                <motion.div
                  key={exam._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="h-full overflow-hidden">
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: exam.subjectColor }}
                    />
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-display font-semibold">
                            {exam.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {exam.subjectName}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="Edit exam"
                            onClick={() => {
                              setEditing(exam);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label="Delete exam"
                            onClick={() => setDeleting(exam)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarClock className="h-4 w-4" />
                          {new Date(exam.examDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          className={cn(
                            "font-display font-bold",
                            urgencyClass(days)
                          )}
                        >
                          {countdownLabel(days)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {exam.difficulty}
                        </Badge>
                        <Badge variant="outline">Priority {exam.importance}/5</Badge>
                      </div>

                      {exam.topicsTotal && exam.topicsTotal > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Syllabus</span>
                            <span>
                              {exam.topicsDone}/{exam.topicsTotal} done
                            </span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                          <ul className="space-y-1 pt-1">
                            {exam.syllabusTopics.slice(0, 6).map((t, i) => (
                              <li key={`${t.name}-${i}`}>
                                <button
                                  type="button"
                                  onClick={() => toggleTopic(exam, i)}
                                  className="flex w-full items-center gap-2 text-left text-sm"
                                >
                                  <span
                                    className={cn(
                                      "grid h-4 w-4 shrink-0 place-items-center rounded border",
                                      t.done
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border"
                                    )}
                                  >
                                    {t.done ? <Check className="h-3 w-3" /> : null}
                                  </span>
                                  <span
                                    className={cn(
                                      "truncate",
                                      t.done &&
                                        "text-muted-foreground line-through"
                                    )}
                                  >
                                    {t.name}
                                  </span>
                                </button>
                              </li>
                            ))}
                            {exam.syllabusTopics.length > 6 ? (
                              <li className="text-xs text-muted-foreground">
                                +{exam.syllabusTopics.length - 6} more
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ExamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        exam={editing}
        subjects={subjects}
        onSaved={onChanged}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{deleting?.title}&rdquo; and unschedules any
              linked study blocks. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
