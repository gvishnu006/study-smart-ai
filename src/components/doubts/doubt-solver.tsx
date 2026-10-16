"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  Loader2,
  MessageSquare,
  Lightbulb,
  BookOpen,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/shared/logo";
import { apiPost } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  {
    icon: Calculator,
    label: "Solve a problem",
    prompt: "Walk me through how to solve this step by step: ",
  },
  {
    icon: Lightbulb,
    label: "Explain a concept",
    prompt: "Explain this concept simply, with an example: ",
  },
  {
    icon: BookOpen,
    label: "Compare ideas",
    prompt: "What's the difference between these two ideas: ",
  },
];

export function DoubtSolver({
  subjects,
}: {
  subjects: { _id: string; name: string; color: string }[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [subjectId, setSubjectId] = useState("none");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    scrollDown();
    try {
      const res = await apiPost<{ answer: string }>("/api/ai/doubt", {
        question: q,
        subjectId: subjectId === "none" ? undefined : subjectId,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get an answer.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      scrollDown();
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Card className="flex h-[calc(100vh-13rem)] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-primary" /> Doubt solver
          </div>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="No subject context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No subject context</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <Logo className="h-10" />
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Ask me anything
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Stuck on a problem or concept? Get a clear, step-by-step
                  explanation.
                </p>
              </div>
              <div className="grid w-full max-w-lg gap-3 sm:grid-cols-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setInput(s.prompt)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:bg-secondary"
                  >
                    <s.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {loading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Type your doubt… (Enter to send, Shift+Enter for a new line)"
              rows={1}
              className="max-h-40 min-h-[44px] resize-none"
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={() => ask(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="h-fit">
        <CardContent className="space-y-3 p-5 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-primary" /> How to get the best
            answers
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span> Paste the exact question or
              your own attempt.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span> Pick the subject to ground
              answers in your notes.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span> Ask follow-ups — it
              remembers the conversation.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
