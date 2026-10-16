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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECT_COLORS, cn } from "@/lib/utils";
import { apiPatch, apiPost } from "@/lib/fetcher";
import type { SubjectDTO } from "@/types/app";

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subject?: SubjectDTO | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(subject?.name ?? "");
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    subject?.difficulty ?? "medium"
  );
  const [description, setDescription] = useState(subject?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error("Enter a subject name.");
      return;
    }
    setSaving(true);
    try {
      const body = { name: name.trim(), color, difficulty, description };
      if (subject) {
        await apiPatch(`/api/subjects/${subject._id}`, body);
        toast.success("Subject updated.");
      } else {
        await apiPost("/api/subjects", body);
        toast.success("Subject created.");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save subject.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? "Edit subject" : "New subject"}</DialogTitle>
          <DialogDescription>
            Subjects group your chapters and materials together.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-name">Name</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Chemistry"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                    color === c ? "ring-2 ring-foreground" : "hover:scale-110"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="subject-desc">Description (optional)</Label>
            <Textarea
              id="subject-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this subject cover?"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : subject ? "Save changes" : "Create subject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
