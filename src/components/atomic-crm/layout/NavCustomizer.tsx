import { useSyncExternalStore } from "react";
import { useGetIdentity } from "ra-core";
import { Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyNavPrefs,
  effectivePrimaryKeys,
  isLockedNavKey,
  isPrimaryNav,
  navPrefsStore,
} from "./navPrefsStore";

/** Hide + reorder nav sections; changes sync to the account. */
export const NavCustomizer = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const prefs = useSyncExternalStore(navPrefsStore.subscribe, navPrefsStore.get);
  const { identity } = useGetIdentity();
  const salesId = identity?.id ? Number(identity.id) : null;
  const items = applyNavPrefs(prefs, { includeHidden: true });

  const save = (hidden: string[], order: string[], primary?: string[]) =>
    navPrefsStore.set({ hidden, order, primary: primary ?? prefs.primary ?? [] }, salesId);

  const togglePin = (key: string) => {
    // Seed from the current effective set on first customization.
    const cur = prefs.primary && prefs.primary.length > 0 ? prefs.primary : effectivePrimaryKeys(prefs);
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    save(prefs.hidden, items.map((i) => i.key), next);
  };

  const toggle = (key: string) =>
    save(
      prefs.hidden.includes(key)
        ? prefs.hidden.filter((k) => k !== key)
        : [...prefs.hidden, key],
      items.map((i) => i.key),
    );

  const move = (key: string, dir: -1 | 1) => {
    const order = items.map((i) => i.key);
    const idx = order.indexOf(key);
    const swap = idx + dir;
    if (swap < 0 || swap >= order.length) return;
    [order[idx], order[swap]] = [order[swap], order[idx]];
    save(prefs.hidden, order);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize navigation</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          ★ pins a section to the header row and mobile bar; the rest live
          under "More". Eye hides it entirely (still in ⌘K search). Arrows
          reorder. Syncs to all your devices.
        </p>
        <div className="flex flex-col divide-y rounded-xl border">
          {items.map((n, i) => {
            const hidden = prefs.hidden.includes(n.key);
            const locked = isLockedNavKey(n.key);
            const pinned = isPrimaryNav(prefs, n);
            return (
              <div key={n.key} className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={() => !locked && togglePin(n.key)}
                  disabled={locked}
                  className={cn(
                    locked
                      ? "text-amber-400/40"
                      : pinned
                        ? "text-amber-400 hover:text-muted-foreground"
                        : "text-muted-foreground/30 hover:text-amber-400",
                  )}
                  aria-label={`${pinned ? "Unpin" : "Pin"} ${n.label}`}
                  title={locked ? "Always pinned" : pinned ? "Unpin from header row" : "Pin to header row"}
                >
                  <Star className="size-4" fill={pinned ? "currentColor" : "none"} />
                </button>
                <n.icon className={cn("size-4", hidden ? "text-muted-foreground/50" : "text-primary")} />
                <span className={cn("flex-1 text-sm", hidden && "text-muted-foreground/50 line-through")}>
                  {n.label}
                </span>
                <button
                  onClick={() => move(n.key, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                  aria-label={`Move ${n.label} up`}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  onClick={() => move(n.key, 1)}
                  disabled={i === items.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                  aria-label={`Move ${n.label} down`}
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  onClick={() => !locked && toggle(n.key)}
                  disabled={locked}
                  className={cn(
                    "ml-1",
                    locked
                      ? "text-muted-foreground/30"
                      : hidden
                        ? "text-muted-foreground/50 hover:text-foreground"
                        : "text-primary hover:text-foreground",
                  )}
                  aria-label={`${hidden ? "Show" : "Hide"} ${n.label}`}
                  title={locked ? "Always visible" : hidden ? "Show" : "Hide"}
                >
                  {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 self-start text-muted-foreground"
          onClick={() => save([], [], [])}
        >
          <RotateCcw className="size-3.5" /> Reset to default
        </Button>
      </DialogContent>
    </Dialog>
  );
};
