"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost } from "@/lib/fetcher";
import { cn, formatClock, fireConfetti } from "@/lib/utils";

const PRESETS = [15, 25, 45, 60];

function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + i * 0.18 + 0.6
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.7);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    /* audio not available */
  }
}

export function FocusMode({
  subjects,
}: {
  subjects: { _id: string; name: string; color: string }[];
}) {
  const [duration, setDuration] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState("none");
  const [fullscreen, setFullscreen] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const complete = useCallback(async () => {
    setRunning(false);
    endAtRef.current = null;
    playChime();
    fireConfetti({ count: 90 });
    toast.success("Focus session complete. Great work!");
    try {
      const endedAt = new Date();
      const startedAt = new Date(endedAt.getTime() - duration * 1000);
      await apiPost("/api/study-sessions", {
        subjectId: subjectId === "none" ? undefined : subjectId,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds: duration,
        mode: "focus",
      });
    } catch {
      /* session logging is best-effort */
    }
    setRemaining(duration);
  }, [duration, subjectId]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    endAtRef.current = Date.now() + remaining * 1000;
    intervalRef.current = setInterval(() => {
      if (!endAtRef.current) return;
      const left = Math.round((endAtRef.current - Date.now()) / 1000);
      if (left <= 0) {
        setRemaining(0);
        complete();
      } else {
        setRemaining(left);
      }
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function pick(d: number) {
    setDuration(d);
    setRemaining(d);
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setRemaining(duration);
    endAtRef.current = null;
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const circumference = 2 * Math.PI * 130;

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden />

      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="h-9 w-[170px] bg-background/80 backdrop-blur">
            <SelectValue placeholder="General study" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">General study</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative grid place-items-center">
          <svg width={300} height={300} className="-rotate-90">
            <circle
              cx={150}
              cy={150}
              r={130}
              fill="none"
              strokeWidth={10}
              className="text-muted"
              stroke="currentColor"
            />
            <motion.circle
              cx={150}
              cy={150}
              r={130}
              fill="none"
              strokeWidth={10}
              strokeLinecap="round"
              className="text-primary"
              stroke="currentColor"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-6xl font-bold tabular-nums">
              {formatClock(remaining)}
            </span>
            <span className="mt-1 text-sm text-muted-foreground">
              {running ? "Focusing — stay with it" : "Ready when you are"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="lg" onClick={() => setRunning((r) => !r)}>
            {running ? (
              <>
                <Pause className="h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" /> {remaining < duration ? "Resume" : "Start"}
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={complete} disabled={running}>
            <Check className="h-5 w-5" /> Finish
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={reset}
            aria-label="Reset"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick(p * 60)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                duration === p * 60
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-secondary"
              )}
            >
              {p} min
            </button>
          ))}
          <span className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
            <Timer className="h-3.5 w-3.5" /> Deep work
          </span>
        </div>
      </div>
    </div>
  );
}
