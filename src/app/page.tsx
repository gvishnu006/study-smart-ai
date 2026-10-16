import Link from "next/link";
import {
  Sparkles,
  ListChecks,
  Layers,
  CalendarDays,
  Timer,
  Upload,
  BrainCircuit,
  Rocket,
  Check,
  ArrowRight,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const FEATURES = [
  {
    icon: Upload,
    title: "Upload anything",
    body: "Drop in PDFs, Word docs, slides or photos of handwritten notes. We extract the text for you.",
  },
  {
    icon: ListChecks,
    title: "AI quizzes",
    body: "Generate MCQs, true/false, fill-in-the-blanks and long-answer questions from your own material.",
  },
  {
    icon: Layers,
    title: "Summaries & flashcards",
    body: "Instant summaries, key points, mind maps and spaced-repetition flashcards — in seconds.",
  },
  {
    icon: CalendarDays,
    title: "Smart timetable",
    body: "Add your exams and let the AI build a balanced revision plan that prioritises what's urgent.",
  },
  {
    icon: Timer,
    title: "Focus & tracking",
    body: "Pomodoro and stopwatch timers, streaks, and charts that show exactly where your hours go.",
  },
  {
    icon: MessageSquare,
    title: "Doubt solver",
    body: "Stuck on a problem? Get clear, step-by-step explanations grounded in your course notes.",
  },
];

const STEPS = [
  {
    icon: Upload,
    title: "Add your material",
    body: "Create a subject, upload your notes, and organise them into chapters.",
  },
  {
    icon: BrainCircuit,
    title: "Let the AI work",
    body: "Generate quizzes, summaries, flashcards, and a personalised study timetable.",
  },
  {
    icon: Rocket,
    title: "Study & improve",
    body: "Track your sessions, review weak topics, and watch your scores climb.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Powered by AI · Built for real exams
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                Study less,
                <span className="gradient-text"> learn more.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-pretty">
                Study Smart AI turns your own notes into quizzes, summaries,
                flashcards and a personalised timetable — so you always know
                exactly what to study next.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Start learning free <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-4 text-xs text-muted-foreground">
                No credit card required · Your notes stay private
              </p>
            </Reveal>
          </div>

          {/* Product mock */}
          <Reveal delay={0.2}>
            <div className="mx-auto mt-14 max-w-4xl">
              <div className="rounded-2xl border border-border bg-card p-2 shadow-lift">
                <div className="rounded-xl bg-gradient-to-br from-muted/50 to-background p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        icon: ListChecks,
                        label: "Quiz score",
                        value: "84%",
                        hint: "up 12% this week",
                      },
                      {
                        icon: Timer,
                        label: "Focused today",
                        value: "2h 15m",
                        hint: "goal 2h",
                      },
                      {
                        icon: Trophy,
                        label: "Streak",
                        value: "12 days",
                        hint: "personal best",
                      },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <c.icon className="h-5 w-5 text-primary" />
                        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                          {c.label}
                        </p>
                        <p className="font-display text-2xl font-bold">{c.value}</p>
                        <p className="text-xs text-muted-foreground">{c.hint}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI summary · Organic Chemistry
                    </div>
                    <div className="mt-3 space-y-2">
                      {[100, 92, 78].map((w, i) => (
                        <div
                          key={i}
                          className="h-2.5 rounded-full bg-muted"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Everything you need to ace it
            </h2>
            <p className="mt-3 text-muted-foreground">
              One calm workspace that replaces a dozen scattered apps.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                How it works
              </h2>
              <p className="mt-3 text-muted-foreground">
                From messy notes to a clear plan in three steps.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="relative h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="absolute right-5 top-5 font-display text-4xl font-bold text-muted/70">
                    {i + 1}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 px-6 py-14 text-center sm:px-12">
            <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Your next exam starts today
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join students who study smarter with AI-generated practice,
                clear revision notes, and a plan that adapts to them.
              </p>
              <ul className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Free to start", "Works on mobile", "Cancel anytime"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-success" /> {t}
                    </li>
                  )
                )}
              </ul>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Create your free account <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Study Smart AI. Built for learners.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
