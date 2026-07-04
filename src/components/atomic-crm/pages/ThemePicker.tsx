import { useState } from "react";
import { Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ACCENT_PRESETS } from "./pageThemes";
import { cn } from "@/lib/utils";

/** Palette button + swatch dialog. Used by page docs AND app sections. */
export const ThemePicker = ({
  accent,
  onChange,
  label = "Page theme",
}: {
  accent?: string;
  onChange: (accent: string | null) => void;
  label?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label={label}
        title={label}
      >
        <Palette className="size-4" style={accent ? { color: accent } : {}} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-3 py-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.accent}
                onClick={() => {
                  onChange(p.accent);
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-2 border transition-colors hover:bg-accent",
                  accent === p.accent && "border-foreground/40 bg-accent",
                )}
              >
                <span
                  className="size-7 rounded-full"
                  style={{ backgroundColor: p.accent }}
                />
                <span className="text-[10px] text-muted-foreground">{p.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-muted-foreground">Custom</label>
            <input
              type="color"
              value={accent ?? "#6366f1"}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-14 rounded cursor-pointer bg-transparent"
              aria-label="Custom accent color"
            />
            {accent && (
              <button
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="ml-auto text-xs text-muted-foreground underline hover:text-destructive"
              >
                Reset to default
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
