import { ChevronDown, Plus, Search, Settings, SlidersHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGetIdentity } from "ra-core";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, matchPath, useLocation } from "react-router";
import { cn } from "@/lib/utils";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { NAV_ITEMS, type NavItem } from "./navConfig";
import { applyNavPrefs, navPrefsStore } from "./navPrefsStore";
import { NavCustomizer } from "./NavCustomizer";
import { QuickCaptureSheet } from "./QuickCaptureSheet";
import { DemonicEye } from "../misc/DemonicEye";

/**
 * Desktop navigation rail. Groups come from navConfig; the user's
 * hide/reorder prefs (navPrefsStore) are respected. Every visible item is
 * shown — no "More" overflow menu.
 */
export const Sidebar = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const location = useLocation();
  const { identity } = useGetIdentity();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const prefs = useSyncExternalStore(navPrefsStore.subscribe, navPrefsStore.get);
  const salesId = identity?.id ? Number(identity.id) : null;
  useEffect(() => {
    if (salesId) void navPrefsStore.load(salesId);
  }, [salesId]);
  // "c" shortcut and palette action both open capture through this event.
  useEffect(() => {
    const onOpen = () => setCaptureOpen(true);
    window.addEventListener("open-quick-capture", onOpen);
    return () => window.removeEventListener("open-quick-capture", onOpen);
  }, []);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const activePath = NAV_ITEMS.find((n) =>
    n.to === "/"
      ? !!matchPath("/", location.pathname)
      : !!matchPath(`${n.to}/*`, location.pathname),
  )?.to;

  const visible = applyNavPrefs(prefs).filter((n) => n.inHeader);
  const ungrouped = visible.filter((n) => !n.group);
  // Group order follows the first appearance in the user's ordering.
  const groups = [...new Set(visible.filter((n) => n.group).map((n) => n.group!))].map(
    (g) => ({ group: g, items: visible.filter((n) => n.group === g) }),
  );

  return (
    <>
      <aside className="hellfire-edge relative flex h-full w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <Link
          to="/"
          className="flex h-14 shrink-0 items-center gap-2.5 px-5 no-underline"
        >
          <img className="[.light_&]:hidden h-5" src={darkModeLogo} alt="" />
          <img className="[.dark_&]:hidden h-5" src={lightModeLogo} alt="" />
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            {title}
          </span>
        </Link>

        <div className="flex flex-col gap-2 px-3 pb-2">
          <button
            onClick={() => setCaptureOpen(true)}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            title="Quick capture — jot anything"
          >
            <Plus className="size-3.5" />
            Quick capture
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(new Event("open-command-palette"))
            }
            className="flex h-8 w-full items-center gap-2 rounded-md border border-sidebar-border bg-background/70 px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-input"
            aria-label="Search (Ctrl or Cmd + K)"
          >
            <Search className="size-3.5" />
            Search
            <kbd className="ml-auto font-sans text-[0.65rem] text-muted-foreground/80">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="u-scroll flex-1 overflow-y-auto px-3 pb-4">
          {ungrouped.map((n) => (
            <SidebarItem key={n.key} item={n} active={activePath === n.to} />
          ))}
          {groups.map((g) => {
            const collapsed = collapsedGroups.has(g.group);
            return (
              <div key={g.group}>
                <button
                  onClick={() => toggleGroup(g.group)}
                  className="sidebar-group-header flex w-full items-center gap-1.5 px-2.5 pt-5 pb-1.5 text-sidebar-foreground/45"
                  aria-expanded={!collapsed}
                >
                  <span className="u-label flex-1 text-left">{g.group}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      collapsed && "-rotate-90",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "sidebar-group-content",
                    collapsed && "collapsed",
                  )}
                >
                  {g.items.map((n) => (
                    <SidebarItem key={n.key} item={n} active={activePath === n.to} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 border-t border-sidebar-border px-3 py-2">
          <Link
            to="/settings"
            className={cn(
              "flex h-7 flex-1 items-center gap-2 rounded-md px-2 text-xs font-medium no-underline transition-colors",
              activePath === "/settings" ||
                location.pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Settings className="size-3.5" />
            Settings
          </Link>
          <button
            onClick={() => setCustomizeOpen(true)}
            className="flex h-7 items-center rounded-md px-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            aria-label="Customize navigation"
            title="Customize navigation"
          >
            <SlidersHorizontal className="size-3.5" />
          </button>
        </div>
        <DemonicEye size={52} className="mx-auto mt-auto mb-2 opacity-20" />
      </aside>
      <NavCustomizer open={customizeOpen} onOpenChange={setCustomizeOpen} />
      <QuickCaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} />
    </>
  );
};

const SidebarItem = ({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) => {
  const Icon: LucideIcon = item.icon;
  return (
    <Link
      to={item.to}
      title={item.shortcut ? `${item.label} (g ${item.shortcut})` : item.label}
      data-active={active ? "true" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium no-underline transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-all duration-150",
          active
            ? "text-primary"
            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70",
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
};
