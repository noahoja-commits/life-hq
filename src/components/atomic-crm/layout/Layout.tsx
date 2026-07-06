import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { CommandPalette } from "../command/CommandPalette";
import Header from "./Header";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ShortcutHelp } from "./ShortcutHelp";
import { Sidebar } from "./Sidebar";
import { EyeChat } from "./EyeChat";
import { OverdueEffect } from "./OverdueEffect";
import { usePossession, useSummoning } from "../misc/rituals";
import { useNotify } from "ra-core";

/**
 * Desktop shell: black canvas, raised working sheet.
 * Navigation rail on the left, content scrolls independently.
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  const notify = useNotify();
  
  // Lucifer randomly interjects
  usePossession();
  
  // Konami summoning
  useSummoning(() => {
    notify("⛧ YOU HAVE AWAKENED THE ABYSS ⛧", { type: "error" });
  });
  
  return (
    <div className="flex h-dvh overflow-hidden bg-sidebar">
      <OverdueEffect />
      <CommandPalette />
      <KeyboardShortcuts />
      <ShortcutHelp />
      <Sidebar />
      <div className="my-2 mr-2 flex min-w-0 flex-1 flex-col rounded-lg border border-border shadow-sm transition-shadow duration-200">
        <Header />
        <main className="u-scroll flex-1 overflow-y-auto" id="main-content">
          <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
            <ErrorBoundary FallbackComponent={Error}>
              <Suspense fallback={<Skeleton className="skeleton-shimmer h-12 w-12 rounded-full" />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <Notification />
      <EyeChat />
    </div>
  );
};
