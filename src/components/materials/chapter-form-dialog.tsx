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
import { Textarea } from "@/components/ui/textarea";
import { apiPost, apiPatch } from "@/lib/fetcher";
import type { ChapterDTO } from "@/types/app";

export function ChapterFormDialog({
  open,
  onOpenChange,
  subjectId,
  chapter,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subjectId: string;
  chapter?: ChapterDTO | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(chapter?.name ?? "");
  const [topics, setTopics] = useState(chapter?.topics.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error("Enter a chapter name.");
      return;
    }
    setSaving(true);
    try {
      const topicList = topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (chapter) {
        await apiPatch(`/api/chapters/${chapter._id}`, {
          name: name.trim(),
          topics: topicList,
        });
        toast.success("Chapter updated.");
      } else {
        await apiPost("/api/chapters", {
          subjectId,
          name: name.trim(),
          topics: topicList,
        });
        toast.success("Chapter added.");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save chapter.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chapter ? "Edit chapter" : "New chapter"}</DialogTitle>
          <DialogDescription>
            Chapters help you target quizzes and summaries precisely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chapter-name">Chapter name</Label>
            <Input
              id="chapter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chapter 4 — Thermodynamics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chapter-topics">Topics (comma separated)</Label>
            <Textarea
              id="chapter-topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Entropy, Enthalpy, Gibbs free energy"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : chapter ? "Save changes" : "Add chapter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
