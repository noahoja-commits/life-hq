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
  Network,
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
  /** Second key of the "g then <key>" keyboard sequence (desktop). */
  shortcut?: string;
}

// Single source of truth for navigation. Consumed by the desktop Header,
// the mobile Menu sheet, and the command palette — edit here, not there.
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/", icon: Home, inHeader: true, primary: true, shortcut: "d" },
  { key: "todos", label: "To-Dos", to: "/todos", icon: CheckSquare, inHeader: true, primary: true, group: "Plan", shortcut: "t" },
  { key: "jobs", label: "Jobs", to: "/applications", icon: Briefcase, inHeader: true, group: "Work", shortcut: "j" },
  { key: "people", label: "People", to: "/contacts", icon: Users, inHeader: true, group: "Life", shortcut: "e" },
  { key: "places", label: "Places", to: "/companies", icon: MapPin, inHeader: true, group: "Life", shortcut: "b" },
  { key: "projects", label: "Projects", to: "/deals", icon: FolderKanban, inHeader: true, group: "Work", shortcut: "p" },
  { key: "track", label: "Track", to: "/track", icon: Activity, inHeader: true, primary: true, group: "Track", shortcut: "k" },
  { key: "focus", label: "Focus", to: "/focus", icon: Brain, inHeader: true, group: "Plan", shortcut: "f" },
  { key: "lists", label: "Lists", to: "/lists", icon: ListChecks, inHeader: true, group: "Life", shortcut: "l" },
  { key: "routines", label: "Routines", to: "/routines", icon: Repeat, inHeader: true, group: "Life", shortcut: "r" },
  { key: "ventures", label: "Ventures", to: "/ventures", icon: Rocket, inHeader: true, group: "Work", shortcut: "v" },
  { key: "calendar", label: "Calendar", to: "/calendar", icon: CalendarDays, inHeader: true, primary: true, group: "Plan", shortcut: "c" },
  { key: "goals", label: "Goals", to: "/goals", icon: Target, inHeader: true, group: "Plan", shortcut: "g" },
  { key: "dates", label: "Dates", to: "/dates", icon: CalendarHeart, inHeader: true, group: "Plan", shortcut: "y" },
  { key: "money", label: "Money", to: "/money", icon: Wallet, inHeader: true, primary: true, group: "Track", shortcut: "m" },
  { key: "pages", label: "Pages", to: "/pages", icon: NotebookText, inHeader: true, primary: true, group: "Notes", shortcut: "n" },
  { key: "ai", label: "AI", to: "/ai", icon: Sparkles, inHeader: true, primary: true, group: "Notes", shortcut: "a" },
  { key: "scripts", label: "Scripts", to: "/scripts", icon: ScrollText, inHeader: true, group: "Work", shortcut: "x" },
  { key: "review", label: "Review", to: "/review", icon: CalendarCheck, inHeader: true, group: "Track", shortcut: "w" },
  { key: "templates", label: "Templates", to: "/templates", icon: Shapes, inHeader: false, group: "Notes" },
  { key: "files", label: "Files", to: "/files", icon: FolderOpen, inHeader: true, group: "Notes", shortcut: "i" },
  { key: "hub", label: "Hub", to: "/hub", icon: LayoutGrid, inHeader: true, group: "Notes", shortcut: "h" },
  { key: "network", label: "Network", to: "/network", icon: Network, inHeader: true, primary: true, group: "Track", shortcut: "w" },
  { key: "settings", label: "Settings", to: "/settings", icon: Settings, inHeader: false, shortcut: "s" },
];