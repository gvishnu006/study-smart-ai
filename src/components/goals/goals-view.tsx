"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Target,
  Trash2,
  Check,
  Flag,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { apiDelete, apiFetch, apiPatch, apiPost } from "@/lib/fetcher";
import { cn, toDateKey } from "@/lib/utils";
import type { GoalDTO } from "@/types/app";

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-destructive",
};

export function GoalsView({
  subjects,
}: {
  subjects: { _id: string; name: string; color: string }[];
}) {
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"goal" | "todo">("todo");
  const [subjectId, setSubjectId] = useState("none");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await apiFetch<GoalDTO[]>(`/api/goals?date=${dateKey}`));
    } catch {
      toast.error("Could not load your plan.");
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!title.trim()) {
      toast.error("Give it a name.");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/goals", {
        kind,
        title: title.trim(),
        subjectId: subjectId === "none" ? undefined : subjectId,
        priority,
        targetMinutes: kind === "goal" ? targetMinutes : 0,
        date: new Date(`${dateKey}T00:00:00`).toISOString(),
      });
      setTitle("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(g: GoalDTO) {
    setGoals((prev) =>
      prev.map((x) => (x._id === g._id ? { ...x, done: !x.done } : x))
    );
    try {
      await apiPatch(`/api/goals/${g._id}`, { done: !g.done });
    } catch {
      toast.error("Could not update.");
      load();
    }
  }

  async function remove(id: string) {
    setGoals((prev) => prev.filter((x) => x._id !== id));
    try {
      await apiDelete(`/api/goals/${id}`);
    } catch {
      toast.error("Could not delete.");
      load();
    }
  }

  const done = goals.filter((g) => g.done);
  const pending = goals.filter((g) => !g.done);
  const pct = goals.length ? (done.length / goals.length) * 100 : 0;
  const isToday = dateKey === toDateKey(new Date());

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* List */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isToday
                ? "Today"
                : new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
            </CardTitle>
            <Input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="h-9 w-auto"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={pct} className="h-2" />
              <span className="shrink-0 text-xs text-muted-foreground">
                {done.length}/{goals.length}
              </span>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : goals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Nothing planned"
                description="Add a goal or to-do to structure your study day."
              />
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {[...pending, ...done].map((g) => (
                    <motion.li
                      key={g._id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                    >
                      <button
                        type="button"
                        aria-label="Toggle complete"
                        onClick={() => toggle(g)}
                        className="shrink-0"
                      >
                        {g.done ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "flex items-center gap-2 truncate text-sm font-medium",
                            g.done && "text-muted-foreground line-through"
                          )}
                        >
                          <Flag
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              PRIORITY_DOT[g.priority]
                                ?.replace("bg-", "text-")
                            )}
                          />
                          {g.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {g.subjectName ? (
                            <span className="flex items-center gap-1">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor: g.subjectColor ?? "#0d9488",
                                }}
                              />
                              {g.subjectName}
                            </span>
                          ) : null}
                          {g.targetMinutes > 0 ? (
                            <span>· {g.targetMinutes} min</span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => remove(g._id)}
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add form */}
      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add to your plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setKind("todo")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
                kind === "todo"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Check className="h-3.5 w-3.5" /> To-do
            </button>
            <button
              type="button"
              onClick={() => setKind("goal")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
                kind === "goal"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Target className="h-3.5 w-3.5" /> Time goal
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-title">What do you want to do?</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={
                kind === "goal"
                  ? "e.g. Study Calculus for 60 min"
                  : "e.g. Review Chapter 3 notes"
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Subject (optional)</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {kind === "goal" ? (
            <div className="space-y-2">
              <Label htmlFor="goal-minutes">Target minutes</Label>
              <Input
                id="goal-minutes"
                type="number"
                min={5}
                step={5}
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Number(e.target.value))}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "h-9 flex-1 rounded-lg border text-sm font-medium capitalize transition-colors",
                    priority === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={add} disabled={saving}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
