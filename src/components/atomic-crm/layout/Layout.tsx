import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { CommandPalette } from "../command/CommandPalette";
import Header from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * Desktop shell: navigation rail on the chrome-grey canvas, content inside
 * a raised, bordered "working sheet" that scrolls independently.
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  return (
    <div className="flex h-dvh overflow-hidden bg-sidebar">
      <CommandPalette />
      <Sidebar />
      <div className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xs">
        <Header />
        <main className="u-scroll flex-1 overflow-y-auto" id="main-content">
          <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
            <ErrorBoundary FallbackComponent={Error}>
              <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
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
