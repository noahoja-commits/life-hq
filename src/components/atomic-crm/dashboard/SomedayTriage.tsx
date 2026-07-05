import { useMemo, useState } from "react";
import { useDelete, useNotify, useUpdate } from "ra-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Deal } from "../types";

/** Small on purpose: five decisions is a win, not a chore. */
const SESSION_SIZE = 5;

/**
 * Someday triage — pulls a few random items out of the Someday bucket and
 * asks for one decision each: activate, soon, keep, or shred. Keeps the
 * bucket from becoming a graveyard without demanding a full review.
 */
export const SomedayTriage = ({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: Deal[];
}) => {
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const notify = useNotify();
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState(0);

  // Deck is shuffled once when the dialog opens and stays fixed while it's
  // open, so optimistic updates on the parent list don't reshuffle mid-run.
  const deck = useMemo(() => {
    if (!open) return [];
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, SESSION_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setIndex(0);
      setDecisions(0);
    }
  };

  const current = deck[index];
  const done = open && (deck.length === 0 || index >= deck.length);

  const next = (counted: boolean) => {
    if (counted) setDecisions((d) => d + 1);
    setIndex((i) => i + 1);
  };

  const setStage = (stage: "active" | "soon") => {
    if (!current) return;
    update(
      "deals",
      { id: current.id, data: { stage }, previousData: current },
      { mutationMode: "optimistic" },
    );
    notify(stage === "active" ? `In motion: ${current.name}` : `Soon: ${current.name}`, {
      type: "info",
    });
    next(true);
  };

  const shred = () => {
    if (!current) return;
    deleteOne(
      "deals",
      { id: current.id, previousData: current },
      {
        onSuccess: () => notify(`Shredded: ${current.name}`, { type: "info" }),
        onError: () => notify("Could not delete that one", { type: "error" }),
      },
    );
    next(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="u-label text-muted-foreground">
            {done
              ? "Someday triage"
              : `Someday triage · ${Math.min(index + 1, deck.length)} of ${deck.length}`}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              {decisions === 0
                ? "Bucket's empty — nothing to triage."
                : `That's the session — ${decisions} decision${decisions === 1 ? "" : "s"} made. The bucket breathes easier.`}
            </p>
            <button
              onClick={() => handleOpenChange(false)}
              className="h-8 self-start rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : current ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-base font-semibold tracking-tight">{current.name}</p>
              {current.description && (
                <p className="mt-1 line-clamp-3 text-[13px] text-muted-foreground">
                  {current.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStage("active")}
                className="h-9 rounded-md bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Make it happen
              </button>
              <button
                onClick={() => setStage("soon")}
                className="h-9 rounded-md border border-primary/30 text-[13px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Soon
              </button>
              <button
                onClick={() => next(false)}
                className="h-9 rounded-md border text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent/50"
              >
                Keep for later
              </button>
              <button
                onClick={shred}
                className="h-9 rounded-md border border-destructive/30 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Shred it
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              No wrong answers — "keep" is a real choice.
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
