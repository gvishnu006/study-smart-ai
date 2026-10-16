"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UploadCloud, FileText, X, Check, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn, formatBytes } from "@/lib/utils";
import type { ChapterDTO, SubjectDTO } from "@/types/app";

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

const MAX_BYTES = 15 * 1024 * 1024;

interface QueueItem {
  id: string;
  file: File;
  status: "queued" | "ocr" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  method?: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

async function runOcr(file: File, onProgress: (p: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress(m.progress);
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}

function uploadWithProgress(
  form: FormData,
  onProgress: (p: number) => void
): Promise<{ method?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/materials");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
          resolve({ method: data.data?.method });
        } else {
          reject(new Error(data.error || "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}

export function UploadDialog({
  open,
  onOpenChange,
  subjects,
  chapters,
  defaultSubjectId,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subjects: SubjectDTO[];
  chapters: ChapterDTO[];
  defaultSubjectId?: string;
  onUploaded: () => void;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || "");
  const [newSubject, setNewSubject] = useState("");
  const [chapterId, setChapterId] = useState<string>("none");
  const [newChapter, setNewChapter] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(false);

  const subjectChapters = useMemo(
    () => chapters.filter((c) => c.subjectId === subjectId),
    [chapters, subjectId]
  );

  const creatingSubject = !subjectId;

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    const oversized = (rejected as { file: File }[]).map((r) => r.file);
    if (oversized.length) {
      toast.error("Some files were skipped (too large or unsupported).");
    }
    setItems((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: uid(),
        file,
        status: "queued" as const,
        progress: 0,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_BYTES,
    multiple: true,
  });

  function update(id: string, patch: Partial<QueueItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }

  async function handleUpload() {
    if (!subjectId && !newSubject.trim()) {
      toast.error("Choose a subject or enter a new subject name.");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one file to upload.");
      return;
    }
    setBusy(true);
    abortRef.current = false;
    let successCount = 0;

    for (const item of items) {
      if (item.status === "done" || abortRef.current) continue;
      try {
        let clientText = "";
        const isImage = item.file.type.startsWith("image/");
        if (isImage && item.file.size < 8 * 1024 * 1024) {
          update(item.id, { status: "ocr", progress: 5 });
          try {
            clientText = await runOcr(item.file, (p) =>
              update(item.id, { progress: Math.max(5, Math.round(p * 80)) })
            );
          } catch {
            clientText = "";
          }
        }

        const form = new FormData();
        form.append("file", item.file);
        if (subjectId) form.append("subjectId", subjectId);
        else form.append("subjectName", newSubject.trim());
        if (chapterId !== "none") form.append("chapterId", chapterId);
        else if (newChapter.trim()) form.append("chapterName", newChapter.trim());
        form.append("title", item.file.name.replace(/\.[^.]+$/, ""));
        if (clientText) form.append("clientText", clientText);

        update(item.id, { status: "uploading", progress: 10 });
        const res = await uploadWithProgress(form, (p) =>
          update(item.id, { progress: Math.max(10, p) })
        );
        update(item.id, { status: "done", progress: 100, method: res.method });
        successCount++;
      } catch (err) {
        update(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    setBusy(false);
    if (successCount > 0) {
      toast.success(
        `Added ${successCount} material${successCount > 1 ? "s" : ""}.`
      );
      onUploaded();
      if (items.every((i) => i.status === "done")) {
        setTimeout(() => {
          onOpenChange(false);
          setItems([]);
          setNewSubject("");
          setNewChapter("");
        }, 700);
      }
    }
  }

  const doneCount = items.filter((i) => i.status === "done").length;
  const overall = items.length
    ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload study material</DialogTitle>
          <DialogDescription>
            PDF, DOCX, TXT, or images up to 15 MB. We extract the text so the AI
            can quiz and summarize it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5",
              isDragActive && "border-primary bg-primary/5"
            )}
          >
            <input {...getInputProps()} aria-label="Choose files to upload" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop or click to choose"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF · DOCX · TXT · PNG · JPG (max 15 MB each)
            </p>
          </div>

          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {item.file.name}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatBytes(item.file.size)}
                      </span>
                    </div>
                    {item.status === "error" ? (
                      <p className="truncate text-xs text-destructive">
                        {item.error}
                      </p>
                    ) : item.status === "done" ? (
                      <p className="text-xs text-success">
                        Ready{item.method === "ocr" || item.method === "client"
                          ? " · OCR"
                          : ""}
                      </p>
                    ) : (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={item.progress} className="h-1.5" />
                        <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                          {item.status === "ocr"
                            ? "Reading…"
                            : `${item.progress}%`}
                        </span>
                      </div>
                    )}
                  </div>
                  {item.status === "done" ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : item.status === "error" ? (
                    <button
                      onClick={() =>
                        setItems((p) => p.filter((i) => i.id !== item.id))
                      }
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ) : item.status === "queued" ? (
                    <button
                      onClick={() =>
                        setItems((p) => p.filter((i) => i.id !== item.id))
                      }
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={subjectId || "new"}
                onValueChange={(v) => {
                  setSubjectId(v === "new" ? "" : v);
                  setChapterId("none");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ New subject</SelectItem>
                </SelectContent>
              </Select>
              {creatingSubject ? (
                <Input
                  placeholder="New subject name (e.g. Biology)"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Chapter (optional)</Label>
              <Select
                value={chapterId}
                onValueChange={setChapterId}
                disabled={creatingSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No chapter</SelectItem>
                  {subjectChapters.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or new chapter name"
                value={newChapter}
                onChange={(e) => {
                  setNewChapter(e.target.value);
                  if (e.target.value) setChapterId("none");
                }}
                disabled={creatingSubject || chapterId !== "none"}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="items-center gap-3">
          {items.length > 0 ? (
            <div className="mr-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">
                {doneCount}/{items.length} done
              </Badge>
              {busy ? <span>{overall}%</span> : null}
            </div>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={busy || items.length === 0}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              "Upload & extract"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
