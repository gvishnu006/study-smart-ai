import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <Link href="/" className="relative">
          <span className="inline-flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a2 2 0 0 1 2 2v12a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 1 4 15V5.5Z" />
              </svg>
            </span>
            <span className="font-display text-lg font-bold">Study Smart AI</span>
          </span>
        </Link>
        <div className="relative space-y-6">
          <blockquote className="max-w-md space-y-4">
            <p className="font-display text-2xl font-semibold leading-snug text-balance">
              &ldquo;Study less, learn more. Study Smart AI turns your notes into
              a plan, a quiz, and a reason to keep going.&rdquo;
            </p>
            <footer className="text-sm text-white/70">
              Built for students who are tired of guessing what to study.
            </footer>
          </blockquote>
          <ul className="space-y-2 text-sm text-white/80">
            <li>✓ AI quizzes from your own materials</li>
            <li>✓ Smart timetable that adapts when you miss a day</li>
            <li>✓ Focus timer, streaks, and progress reports</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Study Smart AI
        </p>
      </div>

      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-5 lg:justify-end">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
