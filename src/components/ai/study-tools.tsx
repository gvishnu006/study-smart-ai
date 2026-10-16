"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Network,
  Layers,
  MessageSquare,
  Wand2,
  Loader2,
  Baby,
  BookOpenText,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FlashcardDeck } from "@/components/ai/flashcard-deck";
import { NotesChat } from "@/components/ai/notes-chat";
import { apiDelete, apiFetch, apiPatch, apiPost } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { ChapterDTO, FlashcardDTO, SubjectDTO } from "@/types/app";

type Kind = "summary" | "keypoints" | "mindmap" | "flashcards";

interface SummaryResult {
  title?: string;
  overview?: string;
  sections?: { heading: string; points: string[] }[];
}
interface KeyPointsResult {
  title?: string;
  keyPoints?: string[];
}
interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}
interface MindMapResult {
  title?: string;
  root?: MindMapNode;
}

function MindBranch({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
  return (
    <div className={cn(depth > 0 && "ml-5 border-l border-border pl-4")}>
      <div className="flex items-center gap-2 py-1">
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            depth === 0 ? "bg-primary" : "bg-muted-foreground/50"
          )}
        />
        <span
          className={cn(
            "text-sm",
            depth === 0 ? "font-display font-semibold" : "text-foreground/90"
          )}
        >
          {node.label}
        </span>
      </div>
      {node.children?.map((c, i) => (
        <MindBranch key={`${c.label}-${i}`} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export function StudyTools({
  subjects,
  chapters,
  initialFlashcards,
}: {
  subjects: SubjectDTO[];
  chapters: ChapterDTO[];
  initialFlashcards: FlashcardDTO[];
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?._id ?? "");
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [style, setStyle] = useState<"eli10" | "detailed">("detailed");
  const [loadingKind, setLoadingKind] = useState<Kind | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [keyPoints, setKeyPoints] = useState<KeyPointsResult | null>(null);
  const [mindMap, setMindMap] = useState<MindMapResult | null>(null);
  const [flashcards, setFlashcards] = useState(initialFlashcards);

  const subjectChapters = useMemo(
    () => chapters.filter((c) => c.subjectId === subjectId),
    [chapters, subjectId]
  );

  function toggleChapter(id: string) {
    setChapterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function generate(kind: Kind) {
    if (!subjectId) {
      toast.error("Choose a subject first.");
      return;
    }
    setLoadingKind(kind);
    try {
      const data = await apiPost<Record<string, unknown>>("/api/ai/summarize", {
        subjectId,
        chapterIds,
        materialIds: [],
        kind,
        style: kind === "summary" || kind === "flashcards" ? style : undefined,
      });
      if (kind === "summary") setSummary(data as SummaryResult);
      if (kind === "keypoints") setKeyPoints(data as KeyPointsResult);
      if (kind === "mindmap") setMindMap(data as MindMapResult);
      if (kind === "flashcards") {
        const fresh = await apiFetch<FlashcardDTO[]>("/api/flashcards");
        setFlashcards(fresh);
        toast.success("Flashcards generated and saved.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoadingKind(null);
    }
  }

  async function rateCard(id: string, familiarity: number) {
    setFlashcards((prev) =>
      prev.map((c) => (c._id === id ? { ...c, familiarity } : c))
    );
    try {
      await apiPatch(`/api/flashcards?id=${id}`, { familiarity });
    } catch {
      /* non-critical */
    }
  }

  async function deleteCard(id: string) {
    setFlashcards((prev) => prev.filter((c) => c._id !== id));
    try {
      await apiDelete(`/api/flashcards?id=${id}`);
    } catch {
      toast.error("Could not delete flashcard.");
    }
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Upload a subject and some material first — the AI tools work from your
          own notes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={subjectId}
                onValueChange={(v) => {
                  setSubjectId(v);
                  setChapterIds([]);
                  setSummary(null);
                  setKeyPoints(null);
                  setMindMap(null);
                }}
              >
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
            <div className="space-y-2">
              <Label>
                Chapters{" "}
                <span className="font-normal text-muted-foreground">
                  (all if none selected)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {subjectChapters.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No chapters — the whole subject will be used.
                  </span>
                ) : (
                  subjectChapters.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => toggleChapter(c._id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        chapterIds.includes(c._id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary"
                      )}
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">
            <BookOpenText className="mr-1.5 h-4 w-4" /> Summary
          </TabsTrigger>
          <TabsTrigger value="keypoints">
            <Lightbulb className="mr-1.5 h-4 w-4" /> Key points
          </TabsTrigger>
          <TabsTrigger value="mindmap">
            <Network className="mr-1.5 h-4 w-4" /> Mind map
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Layers className="mr-1.5 h-4 w-4" /> Flashcards
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-1.5 h-4 w-4" /> Chat with notes
          </TabsTrigger>
        </TabsList>

        {/* Summary */}
        <TabsContent value="summary">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={style === "eli10" ? "default" : "outline"}
                    onClick={() => setStyle("eli10")}
                  >
                    <Baby className="h-4 w-4" /> Explain like I&apos;m 10
                  </Button>
                  <Button
                    size="sm"
                    variant={style === "detailed" ? "default" : "outline"}
                    onClick={() => setStyle("detailed")}
                  >
                    <Wand2 className="h-4 w-4" /> Explain in detail
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => generate("summary")}
                  disabled={loadingKind === "summary"}
                >
                  {loadingKind === "summary" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate summary
                </Button>
              </div>

              {loadingKind === "summary" ? (
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : summary ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  {summary.title ? (
                    <h3 className="font-display text-lg font-bold">
                      {summary.title}
                    </h3>
                  ) : null}
                  {summary.overview ? (
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {summary.overview}
                    </p>
                  ) : null}
                  {summary.sections?.map((s, i) => (
                    <div key={i} className="space-y-1.5">
                      <h4 className="font-display font-semibold">{s.heading}</h4>
                      <ul className="ml-1 space-y-1">
                        {s.points.map((p, j) => (
                          <li key={j} className="flex gap-2 text-sm text-foreground/90">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <p className="pt-2 text-sm text-muted-foreground">
                  Choose a depth, then generate a structured summary of your
                  material.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key points */}
        <TabsContent value="keypoints">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Button
                size="sm"
                onClick={() => generate("keypoints")}
                disabled={loadingKind === "keypoints"}
              >
                {loadingKind === "keypoints" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
                Extract key points
              </Button>
              {loadingKind === "keypoints" ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : keyPoints?.keyPoints?.length ? (
                <ul className="space-y-2">
                  {keyPoints.keyPoints.map((p, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span className="font-display font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{p}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Get a punchy list of the most important points to remember.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mind map */}
        <TabsContent value="mindmap">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Button
                size="sm"
                onClick={() => generate("mindmap")}
                disabled={loadingKind === "mindmap"}
              >
                {loadingKind === "mindmap" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Network className="h-4 w-4" />
                )}
                Build mind map
              </Button>
              {loadingKind === "mindmap" ? (
                <Skeleton className="h-40 w-full" />
              ) : mindMap?.root ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-border bg-muted/20 p-5"
                >
                  {mindMap.title ? (
                    <p className="mb-3 font-display font-bold">{mindMap.title}</p>
                  ) : null}
                  <MindBranch node={mindMap.root} />
                </motion.div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Turn the chapter into a visual outline you can follow.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flashcards */}
        <TabsContent value="flashcards">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {flashcards.length} saved card
                  {flashcards.length !== 1 ? "s" : ""}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => generate("flashcards")}
                  disabled={loadingKind === "flashcards"}
                >
                  {loadingKind === "flashcards" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Layers className="h-4 w-4" />
                  )}
                  Generate flashcards
                </Button>
              </div>
              <FlashcardDeck
                cards={flashcards}
                onRate={rateCard}
                onDelete={deleteCard}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat">
          <NotesChat
            subjectId={subjectId}
            chapterIds={chapterIds}
            disabled={!subjectId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
