import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Home,
  Menu as MenuIcon,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router";
import { useGetIdentity } from "ra-core";
import { useEffect, useState, useSyncExternalStore } from "react";
import { QuickCaptureSheet } from "./QuickCaptureSheet";
import { applyNavPrefs, isPrimaryNav, navPrefsStore } from "./navPrefsStore";
import { NavCustomizer } from "./NavCustomizer";

export const MobileNavigation = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const prefs = useSyncExternalStore(navPrefsStore.subscribe, navPrefsStore.get);
  const { identity } = useGetIdentity();
  const salesId = identity?.id ? Number(identity.id) : null;
  useEffect(() => {
    if (salesId) void navPrefsStore.load(salesId);
  }, [salesId]);
  const menuSections = applyNavPrefs(prefs);
  // Bottom-bar slots follow the user's nav order (first two after Dashboard),
  // so reordering nav personalizes the bar too.
  const pinned = menuSections
    .filter((n) => n.key !== "dashboard" && n.key !== "settings" && isPrimaryNav(prefs, n))
    .slice(0, 2);

  const isActive = (path: string) =>
    path === "/"
      ? !!matchPath("/", location.pathname)
      : !!matchPath(`${path}/*`, location.pathname);

  const isPwa = window.matchMedia("(display-mode: standalone)").matches;
  const isWebiOS = /iPad|iPod|iPhone/.test(window.navigator.userAgent);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-secondary/80 backdrop-blur-lg border-t border-border/40 h-14"
      style={{ paddingBottom: isPwa && isWebiOS ? 15 : undefined }}
    >
      <div className="flex justify-around items-center h-14">
        <NavigationButton href="/" Icon={Home} label="Home" isActive={isActive("/")} />
        {pinned[0] && (
          <NavigationButton
            href={pinned[0].to}
            Icon={pinned[0].icon}
            label={pinned[0].label}
            isActive={isActive(pinned[0].to)}
          />
        )}
        <CreateButton />
        {pinned[1] && (
          <NavigationButton
            href={pinned[1].to}
            Icon={pinned[1].icon}
            label={pinned[1].label}
            isActive={isActive(pinned[1].to)}
          />
        )}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 w-16 text-muted-foreground">
              <MenuIcon className="size-6" />
              <span className="text-[0.6rem] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Life HQ</SheetTitle>
            </SheetHeader>
            <div className="px-4 pt-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new Event("open-command-palette"));
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full rounded-xl border bg-card p-3 text-sm text-muted-foreground"
              >
                <Search className="size-4" /> Search everything…
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {menuSections.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 hover:bg-accent transition-colors"
                >
                  <s.icon className="size-5 text-primary" />
                  <span className="text-[0.7rem] font-medium text-center">
                    {s.label}
                  </span>
                </Link>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setCustomizeOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed bg-card p-3 hover:bg-accent transition-colors"
              >
                <SlidersHorizontal className="size-5 text-muted-foreground" />
                <span className="text-[0.7rem] font-medium text-muted-foreground">Customize</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <NavCustomizer open={customizeOpen} onOpenChange={setCustomizeOpen} />
      </div>
    </nav>
  );
};

const NavigationButton = ({
  href,
  Icon,
  label,
  isActive,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  isActive: boolean;
}) => (
  <Button
    asChild
    variant="ghost"
    className={cn(
      "flex-col gap-1 h-auto py-2 px-1 rounded-md w-16",
      isActive ? "text-primary" : "text-muted-foreground",
    )}
  >
    <Link to={href}>
      <Icon className="size-6" />
      <span className="text-[0.6rem] font-medium">{label}</span>
    </Link>
  </Button>
);

const CreateButton = () => {
  const [captureOpen, setCaptureOpen] = useState(false);

  return (
    <>
      <QuickCaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} />
      <Button
        variant="default"
        size="icon"
        className="h-14 w-14 rounded-full -mt-3 shadow-lg transition-transform active:scale-90"
        aria-label="Quick capture"
        onClick={() => setCaptureOpen(true)}
      >
        <Plus className="size-8" />
      </Button>
    </>
  );
};
