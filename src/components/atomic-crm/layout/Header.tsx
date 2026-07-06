import { Download, FileText, Import, Settings, Upload, User, Users } from "lucide-react";
import {
  CanAccess,
  useGetIdentity,
  useNotify,
  useTranslate,
  useUserMenu,
} from "ra-core";
import { useRef, useState } from "react";
import { Link, matchPath, useLocation } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { NotificationBell } from "./NotificationBell";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { exportAllData } from "../misc/exportData";
import { importBackup } from "../misc/importBackup";
import { NAV_ITEMS } from "./navConfig";

/** Titles for routes that don't appear in the nav config. */
const EXTRA_TITLES: Record<string, string> = {
  profile: "Profile",
  import: "Import",
  changelog: "Changelog",
  sales: "Users",
  capture: "Capture",
};

const usePageTitle = (): string => {
  const location = useLocation();
  const navMatch = NAV_ITEMS.find((n) =>
    n.to === "/"
      ? !!matchPath("/", location.pathname)
      : !!matchPath(`${n.to}/*`, location.pathname),
  );
  if (navMatch) return navMatch.to === "/" ? "Dashboard" : navMatch.label;
  const segment = location.pathname.split("/").filter(Boolean)[0] ?? "";
  return EXTRA_TITLES[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
};

/**
 * Slim top bar inside the working sheet: current page title on the left,
 * date + utilities on the right. Navigation lives in the Sidebar.
 */
const Header = () => {
  const title = usePageTitle();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-0.5">
        <span className="mr-2 hidden text-xs text-muted-foreground lg:block">
          {today}
        </span>
        <NotificationBell />
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
    </header>
  );
};

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
