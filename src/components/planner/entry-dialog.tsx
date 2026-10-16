"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPatch, apiPost } from "@/lib/fetcher";
import type { TimetableEntryDTO } from "@/types/app";
import { toDateKey } from "@/lib/utils";

function minutesToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function EntryDialog({
  open,
  onOpenChange,
  entry,
  defaultDateKey,
  subjects,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry?: TimetableEntryDTO | null;
  defaultDateKey?: string;
  subjects: { _id: string; name: string; color: string }[];
  onSaved: () => void;
}) {
  const [subjectId, setSubjectId] = useState(
    entry?.subjectId ?? subjects[0]?._id ?? ""
  );
  const [topic, setTopic] = useState(entry?.topic ?? "Study");
  const [dateKey, setDateKey] = useState(entry?.dateKey ?? defaultDateKey ?? toDateKey(new Date()));
  const [startTime, setStartTime] = useState(
    minutesToTime(entry?.startMinutes ?? 540)
  );
  const [endTime, setEndTime] = useState(
    minutesToTime(entry?.endMinutes ?? (entry?.startMinutes ?? 540) + 60)
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) {
      toast.error("End time must be after the start time.");
      return;
    }
    setSaving(true);
    try {
      const date = new Date(`${dateKey}T00:00:00`).toISOString();
      if (entry) {
        await apiPatch(`/api/timetable/${entry._id}`, {
          topic,
          date,
          startMinutes: start,
          endMinutes: end,
        });
        toast.success("Block updated.");
      } else {
        await apiPost("/api/timetable", {
          subjectId,
          topic,
          date,
          startMinutes: start,
          endMinutes: end,
          source: "manual",
        });
        toast.success("Study block added.");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save block.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Edit study block" : "Add study block"}</DialogTitle>
          <DialogDescription>
            Manually schedule a study session in your timetable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!entry ? (
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
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="entry-topic">Topic</Label>
            <Input
              id="entry-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Practice problems"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-date">Date</Label>
            <Input
              id="entry-date"
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entry-start">Start</Label>
              <Input
                id="entry-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-end">End</Label>
              <Input
                id="entry-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : entry ? "Save changes" : "Add block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
