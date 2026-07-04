import {
  ChevronDown,
  Download,
  FileText,
  Import,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Upload,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CanAccess,
  useGetIdentity,
  useNotify,
  useTranslate,
  useUserMenu,
} from "ra-core";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, matchPath, useLocation } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { exportAllData } from "../misc/exportData";
import { importBackup } from "../misc/importBackup";
import { NAV_ITEMS } from "./navConfig";
import { applyNavPrefs, isPrimaryNav, navPrefsStore } from "./navPrefsStore";
import { NavCustomizer } from "./NavCustomizer";
import { QuickCaptureSheet } from "./QuickCaptureSheet";

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const location = useLocation();
  const { identity } = useGetIdentity();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const prefs = useSyncExternalStore(navPrefsStore.subscribe, navPrefsStore.get);
  const salesId = identity?.id ? Number(identity.id) : null;
  useEffect(() => {
    if (salesId) void navPrefsStore.load(salesId);
  }, [salesId]);

  // Single source of truth: layout/navConfig.ts, user-ordered/hidden via prefs.
  const activePath = NAV_ITEMS.find((n) =>
    n.to === "/"
      ? !!matchPath("/", location.pathname)
      : !!matchPath(`${n.to}/*`, location.pathname),
  )?.to;

  const visible = applyNavPrefs(prefs).filter((n) => n.inHeader);
  const primaryItems = visible.filter((n) => isPrimaryNav(prefs, n));
  const moreItems = visible.filter((n) => !isPrimaryNav(prefs, n));
  const moreActive = moreItems.some((n) => n.to === activePath);
  // Grouped for the "More" menu, preserving the user's order inside groups.
  const moreGroups = [...new Set(moreItems.map((n) => n.group ?? "Other"))].map(
    (g) => ({ group: g, items: moreItems.filter((n) => (n.group ?? "Other") === g) }),
  );

  return (
    <>
      <nav className="grow">
        <header className="sticky top-0 z-40 bg-secondary/70 backdrop-blur-xl border-b border-border/40">
          <div className="px-4">
            <div className="flex items-center gap-3 h-14">
              <Link
                to="/"
                className="flex items-center gap-2 text-secondary-foreground no-underline shrink-0"
              >
                <img
                  className="[.light_&]:hidden h-6"
                  src={darkModeLogo}
                  alt={title}
                />
                <img
                  className="[.dark_&]:hidden h-6"
                  src={lightModeLogo}
                  alt={title}
                />
                <h1 className="text-lg font-semibold hidden sm:block">
                  {title}
                </h1>
              </Link>
              <nav className="flex gap-1 overflow-x-auto no-scrollbar flex-1 justify-center px-2 items-center">
                {primaryItems.map((n) => (
                  <NavigationTab
                    key={n.to}
                    label={n.label}
                    to={n.to}
                    icon={n.icon}
                    active={activePath === n.to}
                  />
                ))}
                {moreItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                          moreActive
                            ? "bg-primary/15 text-primary shadow-sm"
                            : "text-secondary-foreground/60 hover:text-secondary-foreground hover:bg-foreground/5",
                        )}
                      >
                        <LayoutGrid className="size-4 shrink-0" />
                        <span className="hidden lg:inline">More</span>
                        <ChevronDown className="size-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56 max-h-[70vh] overflow-y-auto">
                      {moreGroups.map((g, gi) => (
                        <div key={g.group}>
                          {gi > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {g.group}
                          </DropdownMenuLabel>
                          {g.items.map((n) => (
                            <DropdownMenuItem key={n.to} asChild>
                              <Link
                                to={n.to}
                                className={cn(
                                  "flex items-center gap-2.5",
                                  activePath === n.to && "text-primary",
                                )}
                              >
                                <n.icon className="size-4" />
                                {n.label}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>
              <div className="flex items-center shrink-0">
                <button
                  onClick={() => setCaptureOpen(true)}
                  className="hidden sm:flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity mr-2"
                  aria-label="Quick capture"
                  title="Quick capture — jot anything"
                >
                  <Plus className="size-3.5" />
                  <span className="hidden md:inline">New</span>
                </button>
                <button
                  onClick={() => setCustomizeOpen(true)}
                  className="hidden sm:flex items-center rounded-full border border-border/60 p-1.5 text-muted-foreground hover:bg-foreground/5 transition-colors mr-1"
                  aria-label="Customize navigation"
                  title="Customize navigation"
                >
                  <SlidersHorizontal className="size-3.5" />
                </button>
                <button
                  onClick={() =>
                    window.dispatchEvent(new Event("open-command-palette"))
                  }
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-foreground/5 transition-colors mr-1"
                  aria-label="Search (Ctrl or Cmd + K)"
                >
                  <Search className="size-3.5" />
                  <span className="hidden md:inline">Search</span>
                  <kbd className="hidden md:inline text-[0.65rem] bg-muted rounded px-1 py-0.5 font-sans">
                    ⌘K
                  </kbd>
                </button>
                <ThemeModeToggle />
                <RefreshButton />
                <UserMenu>
                  <ProfileMenu />
                  <CanAccess resource="sales" action="list">
                    <UsersMenu />
                  </CanAccess>
                  <CanAccess resource="configuration" action="edit">
                    <SettingsMenu />
                  </CanAccess>
                  <ImportFromJsonMenuItem />
                  <ExportDataMenuItem />
                  <RestoreBackupMenuItem />
                  <ChangelogMenuItem />
                </UserMenu>
              </div>
            </div>
          </div>
        </header>
      </nav>
      <NavCustomizer open={customizeOpen} onOpenChange={setCustomizeOpen} />
      <QuickCaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} />
    </>
  );
};

const NavigationTab = ({
  label,
  to,
  icon: Icon,
  active,
}: {
  label: string;
  to: string;
  icon: LucideIcon;
  active: boolean;
}) => (
  <Link
    to={to}
    title={label}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
      active
        ? "bg-primary/15 text-primary shadow-sm"
        : "text-secondary-foreground/60 hover:text-secondary-foreground hover:bg-foreground/5",
    )}
  >
    <Icon className="size-4 shrink-0" />
    <span className="hidden lg:inline">{label}</span>
  </Link>
);

const UsersMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<UsersMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/sales" className="flex items-center gap-2">
        <Users />
        {translate("resources.sales.name", { smart_count: 2 })}
      </Link>
    </DropdownMenuItem>
  );
};

const ProfileMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ProfileMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/profile" className="flex items-center gap-2">
        <User />
        {translate("crm.profile.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const SettingsMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<SettingsMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/settings" className="flex items-center gap-2">
        <Settings />
        {translate("crm.settings.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const ImportFromJsonMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ImportFromJsonMenuItem> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/import" className="flex items-center gap-2">
        <Import />
        {translate("crm.header.import_data")}
      </Link>
    </DropdownMenuItem>
  );
};

const ExportDataMenuItem = () => {
  const userMenuContext = useUserMenu();
  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  if (!userMenuContext) {
    throw new Error("<ExportDataMenuItem> must be used inside <UserMenu>");
  }
  const handleExport = async () => {
    setBusy(true);
    try {
      await exportAllData();
      notify("Backup downloaded", { type: "info" });
    } catch {
      notify("Could not export data", { type: "error" });
    } finally {
      setBusy(false);
      userMenuContext.onClose();
    }
  };
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        handleExport();
      }}
      className="flex items-center gap-2"
    >
      <Download />
      {busy ? "Exporting…" : "Export my data"}
    </DropdownMenuItem>
  );
};

const RestoreBackupMenuItem = () => {
  const userMenuContext = useUserMenu();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  if (!userMenuContext) {
    throw new Error("<RestoreBackupMenuItem> must be used inside <UserMenu>");
  }

  const handleFile = async (file: File) => {
    const salesId = identity?.id ? Number(identity.id) : null;
    if (!salesId) {
      notify("Not signed in", { type: "error" });
      return;
    }
    setBusy(true);
    try {
      const backup = JSON.parse(await file.text()) as Record<string, unknown>;
      if (backup.app !== "Life HQ") {
        notify("That doesn't look like a Life HQ backup file", { type: "warning" });
        return;
      }
      const ok = window.confirm(
        "Restore this backup? Everything in it is ADDED as new items (nothing is overwritten or deleted). Restoring the same file twice creates duplicates.",
      );
      if (!ok) return;
      const result = await importBackup(backup, salesId);
      const skippedCount = Object.values(result.skipped).reduce((a, b) => a + b, 0);
      notify(
        `Restored ${result.total} items${skippedCount ? ` (${skippedCount} skipped)` : ""} — refresh to see them`,
        { type: "info", autoHideDuration: 8000 },
      );
    } catch (e) {
      notify(`Restore failed: ${e instanceof Error ? e.message : "bad file"}`, {
        type: "error",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      userMenuContext.onClose();
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          fileRef.current?.click();
        }}
        className="flex items-center gap-2"
      >
        <Upload />
        {busy ? "Restoring…" : "Restore backup"}
      </DropdownMenuItem>
    </>
  );
};

const ChangelogMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ChangelogMenuItem> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/changelog" className="flex items-center gap-2">
        <FileText />
        {translate("crm.changelog.title")}
      </Link>
    </DropdownMenuItem>
  );
};
export default Header;
