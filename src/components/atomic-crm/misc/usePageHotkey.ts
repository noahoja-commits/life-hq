import { useEffect } from "react";

/**
 * Register a keyboard shortcut on a page.
 * Does not fire when the user is typing in an input.
 *
 * Usage:
 *   usePageHotkey("n", () => setShowCreate(true));
 */
export const usePageHotkey = (
  key: string,
  handler: () => void,
  deps: any[] = [],
) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
        return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handler, ...deps]);
};
