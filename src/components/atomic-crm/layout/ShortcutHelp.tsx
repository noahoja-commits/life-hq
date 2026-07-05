import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAV_ITEMS } from "../layout/navConfig";

interface ShortcutGroup {
  group: string;
  shortcuts: { keys: string[]; action: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    group: "Navigation",
    shortcuts: [
      ...NAV_ITEMS.filter((n) => n.shortcut).map((n) => ({
        keys: ["g", n.shortcut!],
        action: n.label,
      })),
      { keys: ["⌘", "K"], action: "Command palette" },
      { keys: ["?"], action: "Show shortcuts" },
      { keys: ["c"], action: "Quick capture" },
      { keys: ["Escape"], action: "Close panel / deselect" },
    ],
  },
  {
    group: "Dashboard",
    shortcuts: [
      { keys: ["Enter"], action: "Submit quick capture" },
      { keys: ["⌘", "Enter"], action: "Submit and stay" },
    ],
  },
  {
    group: "General",
    shortcuts: [
      { keys: ["⌘", "Z"], action: "Undo (when available)" },
      { keys: ["⌘", "S"], action: "Save current form" },
    ],
  },
];

export const ShortcutHelp = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Don't trigger in inputs
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        )
          return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.group}
              </h4>
              <div className="flex flex-col gap-1.5">
                {group.shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{s.action}</span>
                    <span className="flex gap-1">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
