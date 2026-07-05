import { Suspense, type ReactNode } from "react";
import { useLocation } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { CommandPalette } from "../command/CommandPalette";
import Header from "./Header";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Sidebar } from "./Sidebar";

/**
 * Desktop shell: deep indigo canvas, raised working sheet with page
 * transitions. Navigation rail on the left, content scrolls independently.
 * Each route triggers a fade-in-up animation via the page-enter CSS class.
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  const location = useLocation();
  return (
    <div className="flex h-dvh overflow-hidden bg-sidebar">
      <CommandPalette />
      <KeyboardShortcuts />
      <Sidebar />
      <div className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-shadow duration-200">
        <Header />
        <main
          className="u-scroll flex-1 overflow-y-auto page-enter"
          id="main-content"
          key={location.pathname}
        >
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
    </div>
  );
};
