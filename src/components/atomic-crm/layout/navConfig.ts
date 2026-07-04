import {
  Activity,
  Brain,
  Briefcase,
  CalendarCheck,
  CheckSquare,
  FolderKanban,
  FolderOpen,
  Home,
  LayoutGrid,
  ListChecks,
  MapPin,
  NotebookText,
  Wallet,
  Target,
  CalendarHeart,
  CalendarDays,
  Repeat,
  Rocket,
  ScrollText,
  Sparkles,
  Settings,
  Shapes,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Shown in the desktop header pill-nav (Settings lives in the user menu). */
  inHeader: boolean;
  /** In the header's primary row; everything else goes under "More". */
  primary?: boolean;
  /** Group label inside the "More" menu. */
  group?: string;
}

// Single source of truth for navigation. Consumed by the desktop Header,
// the mobile Menu sheet, and the command palette — edit here, not there.
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/", icon: Home, inHeader: true, primary: true },
  { key: "todos", label: "To-Dos", to: "/todos", icon: CheckSquare, inHeader: true, primary: true, group: "Plan" },
  { key: "jobs", label: "Jobs", to: "/applications", icon: Briefcase, inHeader: true, group: "Work" },
  { key: "people", label: "People", to: "/contacts", icon: Users, inHeader: true, group: "Life" },
  { key: "places", label: "Places", to: "/companies", icon: MapPin, inHeader: true, group: "Life" },
  { key: "projects", label: "Projects", to: "/deals", icon: FolderKanban, inHeader: true, group: "Work" },
  { key: "track", label: "Track", to: "/track", icon: Activity, inHeader: true, primary: true, group: "Track" },
  { key: "focus", label: "Focus", to: "/focus", icon: Brain, inHeader: true, group: "Plan" },
  { key: "lists", label: "Lists", to: "/lists", icon: ListChecks, inHeader: true, group: "Life" },
  { key: "routines", label: "Routines", to: "/routines", icon: Repeat, inHeader: true, group: "Life" },
  { key: "ventures", label: "Ventures", to: "/ventures", icon: Rocket, inHeader: true, group: "Work" },
  { key: "calendar", label: "Calendar", to: "/calendar", icon: CalendarDays, inHeader: true, primary: true, group: "Plan" },
  { key: "goals", label: "Goals", to: "/goals", icon: Target, inHeader: true, group: "Plan" },
  { key: "dates", label: "Dates", to: "/dates", icon: CalendarHeart, inHeader: true, group: "Plan" },
  { key: "money", label: "Money", to: "/money", icon: Wallet, inHeader: true, primary: true, group: "Track" },
  { key: "pages", label: "Pages", to: "/pages", icon: NotebookText, inHeader: true, primary: true, group: "Notes" },
  { key: "ai", label: "AI", to: "/ai", icon: Sparkles, inHeader: true, primary: true, group: "Notes" },
  { key: "scripts", label: "Scripts", to: "/scripts", icon: ScrollText, inHeader: true, group: "Work" },
  { key: "review", label: "Review", to: "/review", icon: CalendarCheck, inHeader: true, group: "Track" },
  { key: "templates", label: "Templates", to: "/templates", icon: Shapes, inHeader: false, group: "Notes" },
  { key: "files", label: "Files", to: "/files", icon: FolderOpen, inHeader: true, group: "Notes" },
  { key: "hub", label: "Hub", to: "/hub", icon: LayoutGrid, inHeader: true, group: "Notes" },
  { key: "settings", label: "Settings", to: "/settings", icon: Settings, inHeader: false },
];
