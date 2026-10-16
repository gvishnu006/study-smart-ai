"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer as TimerIcon,
  Coffee,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressRing } from "@/components/shared/progress-ring";
import { useTimer } from "@/hooks/use-timer";
import { apiPost } from "@/lib/fetcher";
import { cn, formatClock } from "@/lib/utils";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const CYCLE = FOCUS_SECONDS + BREAK_SECONDS;

export function TimerCard({
  subjects,
  todayMinutes,
  dailyGoalMinutes,
  onSaved,
}: {
  subjects: { _id: string; name: string; color: string }[];
  todayMinutes: number;
  dailyGoalMinutes: number;
  onSaved: () => void;
}) {
  const { seconds, running, start, pause, reset } = useTimer();
  const [mode, setMode] = useState<"stopwatch" | "pomodoro">("stopwatch");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const lastPhase = useRef<"focus" | "break">("focus");

  // pomodoro phase derivation
  const inCycle = seconds % CYCLE;
  const isBreak = seconds > 0 && inCycle >= FOCUS_SECONDS;
  const phase: "focus" | "break" = mode === "pomodoro" && isBreak ? "break" : "focus";
  const pomodoroRemaining = isBreak ? CYCLE - inCycle : FOCUS_SECONDS - inCycle;
  const completedPomodoros =
    mode === "pomodoro" ? Math.floor(seconds / CYCLE) : 0;

  useEffect(() => {
    if (mode !== "pomodoro") return;
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      toast(
        phase === "break"
          ? "Focus block complete — take a 5-minute break."
          : "Break over — back to focus."
      );
    }
  }, [phase, mode]);

  const goalPct = dailyGoalMinutes > 0 ? (todayMinutes / dailyGoalMinutes) * 100 : 0;

  async function handleStop() {
    if (seconds < 10) {
      toast.error("Sessions under 10 seconds aren't recorded.");
      return;
    }
    setSaving(true);
    try {
      const endedAt = new Date();
      const startedAt = new Date(endedAt.getTime() - seconds * 1000);
      await apiPost("/api/study-sessions", {
        subjectId: subjectId === "none" ? undefined : subjectId,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds: seconds,
        mode,
      });
      toast.success("Session saved. Nice work!");
      reset();
      lastPhase.current = "focus";
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save session.");
    } finally {
      setSaving(false);
    }
  }

  const bigTime = mode === "pomodoro" ? formatClock(pomodoroRemaining) : formatClock(seconds);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:gap-10">
          {/* Timer */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex rounded-full border border-border p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("stopwatch");
                  reset();
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "stopwatch"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TimerIcon className="h-3.5 w-3.5" /> Stopwatch
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("pomodoro");
                  reset();
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "pomodoro"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Brain className="h-3.5 w-3.5" /> Pomodoro
              </button>
            </div>

            <div className="relative grid place-items-center">
              <ProgressRing
                value={mode === "pomodoro" ? (pomodoroRemaining / (isBreak ? BREAK_SECONDS : FOCUS_SECONDS)) * 100 : Math.min(100, (seconds % 3600) / 36)}
                size={190}
                stroke={12}
                barClassName={isBreak ? "text-sky-500" : "text-primary"}
              >
                <div className="flex flex-col items-center">
                  {mode === "pomodoro" ? (
                    <span
                      className={cn(
                        "mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide",
                        isBreak ? "text-sky-500" : "text-primary"
                      )}
                    >
                      {isBreak ? (
                        <>
                          <Coffee className="h-3 w-3" /> Break
                        </>
                      ) : (
                        <>
                          <Brain className="h-3 w-3" /> Focus
                        </>
                      )}
                    </span>
                  ) : null}
                  <span className="font-display text-4xl font-bold tabular-nums">
                    {bigTime}
                  </span>
                  {mode === "pomodoro" ? (
                    <span className="mt-1 text-xs text-muted-foreground">
                      {completedPomodoros} completed
                    </span>
                  ) : null}
                </div>
              </ProgressRing>
            </div>

            <div className="flex items-center gap-2">
              {running ? (
                <Button variant="outline" size="lg" onClick={pause}>
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              ) : (
                <Button size="lg" onClick={start} disabled={seconds > 0}>
                  <Play className="h-4 w-4" /> Start
                </Button>
              )}
              {seconds > 0 && !running ? (
                <Button size="lg" onClick={start} variant="secondary">
                  <Play className="h-4 w-4" /> Resume
                </Button>
              ) : null}
              <Button
                size="lg"
                variant="outline"
                onClick={handleStop}
                disabled={saving || seconds === 0}
              >
                <Square className="h-4 w-4" /> Stop &amp; save
              </Button>
              {seconds > 0 ? (
                <Button size="icon" variant="ghost" onClick={reset} aria-label="Reset">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-1 flex-col justify-between gap-6 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div className="space-y-2">
              <Label>Studying</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="General study" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General study</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-5">
              <ProgressRing
                value={goalPct}
                size={104}
                stroke={9}
                barClassName={goalPct >= 100 ? "text-success" : "text-primary"}
              >
                <span className="font-display text-lg font-bold">
                  {Math.round(goalPct)}%
                </span>
              </ProgressRing>
              <div>
                <p className="text-sm font-medium">Today&apos;s goal</p>
                <p className="font-display text-2xl font-bold">
                  {todayMinutes}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {dailyGoalMinutes} min
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {goalPct >= 100
                    ? "Goal reached — you're on fire."
                    : `${Math.max(0, dailyGoalMinutes - todayMinutes)} minutes to go.`}
                </p>
              </div>
            </div>

            {running ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Recording your focus time…
              </motion.div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
