"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { apiPost } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Summarize the key ideas in two sentences.",
  "Explain the hardest concept here simply.",
  "What would likely be on an exam from this?",
  "Give me a real-world example of the main topic.",
];

export function NotesChat({
  subjectId,
  chapterIds,
  disabled,
}: {
  subjectId: string;
  chapterIds: string[];
  disabled?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || !subjectId) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: Math.random().toString(36).slice(2), role: "user", content: question },
    ]);
    setLoading(true);
    try {
      const data = await apiPost<{ answer: string }>("/api/ai/chat", {
        subjectId,
        chapterIds,
        materialIds: [],
        question,
      });
      setMessages((m) => [
        ...m,
        {
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat failed.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display font-semibold">Chat with your notes</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                Ask anything — answers come only from the material you selected.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={disabled}
                  className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {m.role === "user" ? (
                  <UserIcon className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </motion.div>
          ))
        )}
        {loading ? (
          <div className="flex gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        ) : null}
      </div>
      <CardContent className="border-t border-border p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask a question about your material…"
            rows={1}
            className="max-h-32 min-h-[44px] resize-none"
            disabled={loading || disabled}
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || disabled || !input.trim()}
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
