"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/60 lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" aria-label="Study Smart AI dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-[18px] w-[18px] shrink-0" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <p className="font-display text-sm font-semibold">Keep the streak alive</p>
          <p className="mt-1 text-xs text-white/80">
            Small daily sessions beat one long cram. You&apos;ve got this.
          </p>
        </div>
      </div>
    </aside>
  );
}
