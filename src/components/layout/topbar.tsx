"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Flame } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Logo } from "@/components/shared/logo";
import { UserMenu, type TopbarUser } from "@/components/layout/user-menu";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Topbar({ user }: { user: TopbarUser }) {
  const pathname = usePathname();
  const active = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border p-4 text-left">
              <SheetTitle asChild>
                <Link href="/dashboard">
                  <Logo />
                </Link>
              </SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 p-3" aria-label="Primary">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="font-display text-base font-semibold lg:hidden">
          Study<span className="text-primary">Smart</span>
        </span>
        {active ? (
          <span className="hidden text-sm font-medium text-muted-foreground lg:inline">
            {active.label}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        {user.streak > 0 ? (
          <div
            className="mr-1 hidden items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-sm font-semibold text-warning sm:flex"
            aria-label={`${user.streak} day study streak`}
          >
            <Flame className="h-4 w-4" />
            {user.streak}
          </div>
        ) : null}
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
