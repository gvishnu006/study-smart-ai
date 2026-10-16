"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Trash2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { FlashcardDTO } from "@/types/app";

export function FlashcardDeck({
  cards,
  onRate,
  onDelete,
}: {
  cards: FlashcardDTO[];
  onRate: (id: string, familiarity: number) => void;
  onDelete?: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No flashcards yet"
        description="Generate flashcards from your material — they're saved automatically so you can review them anytime."
      />
    );
  }

  const card = cards[Math.min(index, cards.length - 1)];

  function go(dir: number) {
    setFlipped(false);
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return cards.length - 1;
      if (next >= cards.length) return 0;
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {index + 1} / {cards.length}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              card.familiarity >= 4
                ? "success"
                : card.familiarity >= 2
                  ? "warning"
                  : "destructive"
            }
          >
            Familiarity {card.familiarity}/5
          </Badge>
          {onDelete ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete flashcard"
              onClick={() => {
                onDelete(card._id);
                setFlipped(false);
                setIndex((i) => Math.max(0, i - 1));
              }}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="[perspective:1600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={card._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? "Show question" : "Show answer"}
              className="relative block h-64 w-full [transform-style:preserve-3d]"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                className={cn(
                  "absolute inset-0 grid place-items-center p-6 [backface-visibility:hidden]",
                  "bg-gradient-to-br from-card to-secondary/40"
                )}
              >
                <CardContent className="p-0 text-center">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    Question
                  </p>
                  <p className="font-display text-lg font-semibold leading-snug text-balance">
                    {card.front}
                  </p>
                </CardContent>
              </Card>
              <Card
                className="absolute inset-0 grid place-items-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)" }}
              >
                <CardContent className="p-0 text-center">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                    Answer
                  </p>
                  <p className="text-lg leading-snug text-white text-balance">
                    {card.back}
                  </p>
                </CardContent>
              </Card>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => go(-1)} aria-label="Previous card">
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="ghost" onClick={() => setFlipped((f) => !f)}>
          <RotateCw className="h-4 w-4" /> Flip
        </Button>
        <Button variant="outline" onClick={() => go(1)} aria-label="Next card">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
        <span className="text-sm text-muted-foreground">How well did you know it?</span>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => {
              onRate(card._id, n);
              go(1);
            }}
            className={cn(
              "h-8 w-8 rounded-lg border text-sm font-medium transition-colors",
              card.familiarity === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary"
            )}
            aria-label={`Rate familiarity ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
