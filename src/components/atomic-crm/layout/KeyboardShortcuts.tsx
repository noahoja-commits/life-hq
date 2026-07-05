import { useEffect, useRef, useState } from "react";
import { useRedirect } from "ra-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAV_ITEMS } from "./navConfig";

const SEQUENCE_WINDOW_MS = 1500;

const isTypingTarget = (e: KeyboardEvent): boolean => {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    t.isContentEditable
  );
};

/**
 * Desktop keyboard layer:
 *   c          → quick capture
 *   /  or ⌘K   → command palette
 *   g then <x> → navigate (see navConfig shortcut field)
 *   ?          → this help overlay
 * Sequences are dropped while typing in a field or dialog input.
 */
export const KeyboardShortcuts = () => {
  const redirect = useRedirect();
  const [helpOpen, setHelpOpen] = useState(false);
  const awaitingG = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearSequence = () => {
      awaitingG.current = false;
      if (gTimer.current) clearTimeout(gTimer.current);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e)) {
        clearSequence();
        return;
      }
      const key = e.key;

      if (awaitingG.current) {
        clearSequence();
        const item = NAV_ITEMS.find((n) => n.shortcut === key.toLowerCase());
        if (item) {
          e.preventDefault();
          redirect(item.to);
        }
        return;
      }

      if (key === "g") {
        awaitingG.current = true;
        gTimer.current = setTimeout(() => {
          awaitingG.current = false;
        }, SEQUENCE_WINDOW_MS);
        return;
      }
      if (key === "c") {
        e.preventDefault();
        window.dispatchEvent(new Event("open-quick-capture"));
        return;
      }
      if (key === "/") {
        e.preventDefault();
        window.dispatchEvent(new Event("open-command-palette"));
        return;
      }
      if (key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearSequence();
    };
  }, [redirect]);

  return <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />;
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[0.7rem] text-muted-foreground">
    {children}
  </kbd>
);

const ShortcutsHelp = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const goTargets = NAV_ITEMS.filter((n) => n.shortcut);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div>
            <div className="u-label mb-2 text-muted-foreground">General</div>
            <div className="grid grid-cols-1 gap-1.5 text-[13px] sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span>Quick capture</span>
                <Kbd>c</Kbd>
              </div>
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span>Command palette</span>
                <span className="flex gap-1">
                  <Kbd>/</Kbd>
                  <Kbd>⌘K</Kbd>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span>This overlay</span>
                <Kbd>?</Kbd>
              </div>
            </div>
          </div>
          <div>
            <div className="u-label mb-2 text-muted-foreground">
              Go to — press <span className="normal-case">g</span> then…
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-[13px] sm:grid-cols-2">
              {goTargets.map((n) => (
                <div
                  key={n.key}
                  className="flex items-center justify-between gap-3 py-0.5"
                >
                  <span>{n.label}</span>
                  <span className="flex gap-1">
                    <Kbd>g</Kbd>
                    <Kbd>{n.shortcut}</Kbd>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
