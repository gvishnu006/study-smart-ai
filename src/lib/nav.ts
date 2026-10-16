import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  Sparkles,
  Timer,
  CalendarDays,
  Target,
  MessageSquare,
  Trophy,
  FileDown,
  Settings,
  Flame,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mobile?: boolean;
  description?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    mobile: true,
    description: "Today at a glance",
  },
  {
    href: "/materials",
    label: "Materials",
    icon: BookOpen,
    mobile: true,
    description: "Upload & organize notes",
  },
  {
    href: "/quiz",
    label: "Quiz",
    icon: ListChecks,
    description: "Generate & take quizzes",
  },
  {
    href: "/summarize",
    label: "AI Tools",
    icon: Sparkles,
    description: "Summaries & flashcards",
  },
  {
    href: "/tracker",
    label: "Study Time",
    icon: Timer,
    mobile: true,
    description: "Track your hours",
  },
  {
    href: "/planner",
    label: "Planner",
    icon: CalendarDays,
    mobile: true,
    description: "Exams & timetable",
  },
  {
    href: "/focus",
    label: "Focus",
    icon: Target,
    description: "Distraction-free timer",
  },
  {
    href: "/doubts",
    label: "Doubt Solver",
    icon: MessageSquare,
    description: "Step-by-step answers",
  },
  {
    href: "/goals",
    label: "Goals & To-dos",
    icon: Trophy,
    description: "Daily plan",
  },
  {
    href: "/report",
    label: "Progress Report",
    icon: FileDown,
    description: "Download as PDF",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Profile & preferences",
  },
];

export const MOBILE_NAV = NAV_ITEMS.filter((i) => i.mobile).slice(0, 5);

export const STREAK_ICON = Flame;
