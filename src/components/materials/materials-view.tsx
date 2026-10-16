"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  BookOpen,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Layers,
  Eye,
  FolderOpen,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDialog } from "@/components/materials/upload-dialog";
import { SubjectFormDialog } from "@/components/materials/subject-form-dialog";
import { ChapterFormDialog } from "@/components/materials/chapter-form-dialog";
import { apiDelete, apiFetch } from "@/lib/fetcher";
import { cn, formatBytes } from "@/lib/utils";
import type { ChapterDTO, MaterialDTO, SubjectDTO } from "@/types/app";

interface Props {
  initialSubjects: SubjectDTO[];
  initialChapters: ChapterDTO[];
  initialMaterials: MaterialDTO[];
}

export function MaterialsView({
  initialSubjects,
  initialChapters,
  initialMaterials,
}: Props) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [chapters, setChapters] = useState(initialChapters);
  const [materials, setMaterials] = useState(initialMaterials);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    initialSubjects[0]?._id ?? null
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectDTO | null>(null);
  const [chapterDialog, setChapterDialog] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterDTO | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteSubject, setDeleteSubject] = useState<SubjectDTO | null>(null);
  const [deleteMaterial, setDeleteMaterial] = useState<MaterialDTO | null>(null);

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId) ?? null;
  const subjectChapters = useMemo(
    () => chapters.filter((c) => c.subjectId === selectedSubjectId),
    [chapters, selectedSubjectId]
  );
  const subjectMaterials = useMemo(
    () => materials.filter((m) => m.subjectId === selectedSubjectId),
    [materials, selectedSubjectId]
  );

  const filteredMaterials = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjectMaterials;
    return subjectMaterials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.fileName.toLowerCase().includes(q)
    );
  }, [subjectMaterials, query]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, m] = await Promise.all([
        apiFetch<SubjectDTO[]>("/api/subjects"),
        apiFetch<ChapterDTO[]>("/api/chapters"),
        apiFetch<MaterialDTO[]>("/api/materials"),
      ]);
      setSubjects(s);
      setChapters(c);
      setMaterials(m);
      if (!selectedSubjectId && s[0]) setSelectedSubjectId(s[0]._id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId]);

  async function openPreview(id: string) {
    setPreviewId(id);
    setPreviewLoading(true);
    setPreviewText(null);
    try {
      const data = await apiFetch<MaterialDTO & { text: string }>(
        `/api/materials/${id}`
      );
      setPreviewText(data.text || "No text was extracted from this file.");
    } catch {
      setPreviewText("Could not load the extracted text.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function confirmDeleteSubject() {
    if (!deleteSubject) return;
    try {
      await apiDelete(`/api/subjects/${deleteSubject._id}`);
      toast.success("Subject deleted.");
      if (selectedSubjectId === deleteSubject._id) setSelectedSubjectId(null);
      setDeleteSubject(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function confirmDeleteMaterial() {
    if (!deleteMaterial) return;
    try {
      await apiDelete(`/api/materials/${deleteMaterial._id}`);
      toast.success("Material deleted.");
      setDeleteMaterial(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const previewMaterial = materials.find((m) => m._id === previewId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadOpen(true)} disabled={subjects.length === 0}>
            <Upload className="h-4 w-4" /> Upload material
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingSubject(null);
              setSubjectDialog(true);
            }}
          >
            <Plus className="h-4 w-4" /> New subject
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search materials…"
            className="pl-9"
            aria-label="Search materials"
          />
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Create your first subject"
          description="Subjects are the top level of your study library. Add one, then upload notes, textbooks or a syllabus."
          action={{
            label: "New subject",
            onClick: () => {
              setEditingSubject(null);
              setSubjectDialog(true);
            },
          }}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-1">
            <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subjects
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:overflow-visible lg:pb-0">
              {subjects.map((s) => {
                const active = s._id === selectedSubjectId;
                const count = materials.filter((m) => m.subjectId === s._id).length;
                return (
                  <button
                    key={s._id}
                    onClick={() => setSelectedSubjectId(s._id)}
                    className={cn(
                      "group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: s.color }}
                    />
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto hidden text-xs text-muted-foreground lg:inline">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            {selectedSubject ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-lg text-white"
                      style={{ background: selectedSubject.color }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-semibold">
                        {selectedSubject.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {subjectMaterials.length} material
                        {subjectMaterials.length !== 1 ? "s" : ""} ·{" "}
                        {subjectChapters.length} chapter
                        {subjectChapters.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingChapter(null);
                        setChapterDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Chapter
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Subject options">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSubject(selectedSubject);
                            setSubjectDialog(true);
                          }}
                        >
                          <Pencil /> Edit subject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteSubject(selectedSubject)}
                        >
                          <Trash2 /> Delete subject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {subjectChapters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjectChapters.map((c) => (
                      <div
                        key={c._id}
                        className="group flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-1.5 text-sm"
                      >
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.name}
                        <button
                          aria-label={`Edit ${c.name}`}
                          onClick={() => {
                            setEditingChapter(c);
                            setChapterDialog(true);
                          }}
                          className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {loading && materials.length === 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={query ? "No matching materials" : "No materials yet"}
                    description={
                      query
                        ? "Try a different search term."
                        : "Upload a PDF, DOCX, TXT or image and we'll extract the text for you."
                    }
                    action={
                      query
                        ? undefined
                        : {
                            label: "Upload material",
                            onClick: () => setUploadOpen(true),
                          }
                    }
                  />
                ) : (
                  <motion.div
                    layout
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredMaterials.map((m) => {
                        const chapter = chapters.find((c) => c._id === m.chapterId);
                        return (
                          <motion.div
                            key={m._id}
                            layout
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="group h-full transition-shadow hover:shadow-card">
                              <CardContent className="flex h-full flex-col gap-3 p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Material options"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openPreview(m._id)}>
                                        <Eye /> Preview text
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setDeleteMaterial(m)}
                                      >
                                        <Trash2 /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium" title={m.title}>
                                    {m.title}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {m.fileName}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {chapter ? (
                                    <Badge variant="secondary">{chapter.name}</Badge>
                                  ) : null}
                                  <Badge variant="outline">
                                    {formatBytes(m.fileSize)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {m.charCount.toLocaleString()} chars
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Select a subject"
                description="Choose a subject on the left to see its materials, or create a new one."
              />
            )}
          </section>
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        subjects={subjects}
        chapters={chapters}
        defaultSubjectId={selectedSubjectId ?? undefined}
        onUploaded={refresh}
      />
      <SubjectFormDialog
        open={subjectDialog}
        onOpenChange={setSubjectDialog}
        subject={editingSubject}
        onSaved={refresh}
      />
      {selectedSubject ? (
        <ChapterFormDialog
          open={chapterDialog}
          onOpenChange={setChapterDialog}
          subjectId={selectedSubject._id}
          chapter={editingChapter}
          onSaved={refresh}
        />
      ) : null}

      <Dialog
        open={!!previewId}
        onOpenChange={(v) => {
          if (!v) {
            setPreviewId(null);
            setPreviewText(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewMaterial?.title ?? "Preview"}</DialogTitle>
            <DialogDescription>
              {previewMaterial
                ? `${previewMaterial.fileName} · ${previewMaterial.charCount.toLocaleString()} characters extracted`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-80 rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                {previewText}
              </pre>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteSubject}
        onOpenChange={(v) => !v && setDeleteSubject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes &ldquo;{deleteSubject?.name}&rdquo;, including
              its chapters, materials, quizzes and exams. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSubject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteMaterial}
        onOpenChange={(v) => !v && setDeleteMaterial(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete material?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteMaterial?.title}&rdquo; and its extracted text will be
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMaterial}
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
