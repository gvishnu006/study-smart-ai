"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { apiPost } from "@/lib/fetcher";

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function GeneratePlanDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerated: () => void;
}) {
  const [days, setDays] = useState(7);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");
  const [replaceAuto, setReplaceAuto] = useState(true);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await apiPost<{ created: number }>("/api/ai/timetable", {
        days,
        hoursPerDay,
        sessionMinutes,
        dayStartMinutes: timeToMinutes(startTime),
        dayEndMinutes: timeToMinutes(endTime),
        replaceAuto,
      });
      toast.success(`Added ${res.created} study block${res.created === 1 ? "" : "s"}.`);
      onGenerated();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate study plan</DialogTitle>
          <DialogDescription>
            The AI balances your subjects around upcoming exams, prioritising
            the nearest and hardest ones.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-days">Days to plan</Label>
              <Input
                id="plan-days"
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-hours">Hours per day</Label>
              <Input
                id="plan-hours"
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="plan-session">Block length</Label>
              <Input
                id="plan-session"
                type="number"
                min={15}
                max={180}
                step={15}
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-start">Start</Label>
              <Input
                id="plan-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-end">End</Label>
              <Input
                id="plan-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-sm">Replace existing AI blocks</Label>
              <p className="text-xs text-muted-foreground">
                Your manual blocks are always kept.
              </p>
            </div>
            <Switch checked={replaceAuto} onCheckedChange={setReplaceAuto} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Planning…" : "Generate plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
