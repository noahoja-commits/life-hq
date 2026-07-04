import { useState } from "react";
import { useGetList, useGetIdentity, useCreate, useUpdate, useDelete } from "ra-core";
import { Hourglass, Plus, Trash2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

export interface WaitingItem {
  id: number;
  text: string;
  who?: string;
  since: string;
  nudge_after_days: number;
  resolved: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const daysSince = (iso: string) =>
  Math.round(
    (new Date(todayStr() + "T00:00:00").getTime() - new Date(iso + "T00:00:00").getTime()) / 86400000,
  );

/**
 * Things where the ball is in SOMEONE ELSE'S court — waiting on a recruiter,
 * a refund, a callback. Lapsed ones surface on Today as a nudge to chase.
 */
export const WaitingOnSection = () => {
  const { identity } = useGetIdentity();
  const haptic = useHaptics();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const [text, setText] = useState("");
  const [who, setWho] = useState("");
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data } = useGetList<WaitingItem>("waiting_items", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "since", order: "ASC" },
  });
  const open = (data ?? []).filter((w) => !w.resolved);

  const add = () => {
    if (!text.trim()) return;
    haptic("tick");
    create("waiting_items", {
      data: { text: text.trim(), who: who.trim(), sales_id: salesId },
    });
    setText("");
    setWho("");
  };

  return (
    <section className="mb-6">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <Hourglass className="size-3.5" /> Waiting on {open.length > 0 ? `· ${open.length}` : ""}
      </h2>
      <Card className="p-0 divide-y">
        {open.map((w) => {
          const days = daysSince(w.since);
          const lapsed = days >= w.nudge_after_days;
          return (
            <div key={w.id} className="group flex items-center gap-3 px-4 py-2.5 text-sm">
              <Checkbox
                checked={false}
                onCheckedChange={() => {
                  haptic("success");
                  update(
                    "waiting_items",
                    { id: w.id, data: { resolved: true }, previousData: w },
                    { mutationMode: "optimistic" },
                  );
                }}
                aria-label={`Resolve ${w.text}`}
                className="transition-transform active:scale-90"
              />
              <div className="flex-1 min-w-0">
                <span className="truncate block">{w.text}</span>
                {w.who && <span className="text-xs text-muted-foreground">on {w.who}</span>}
              </div>
              <span
                className={cn(
                  "text-xs shrink-0 tabular-nums",
                  lapsed ? "text-amber-500 font-medium" : "text-muted-foreground",
                )}
              >
                {days === 0 ? "today" : `${days}d`}
                {lapsed ? " · chase it?" : ""}
              </span>
              <button
                onClick={() => {
                  haptic("tick");
                  update(
                    "waiting_items",
                    { id: w.id, data: { since: todayStr() }, previousData: w },
                    { mutationMode: "optimistic" },
                  );
                }}
                className="text-muted-foreground hover:text-primary"
                title="I chased it — reset the clock"
                aria-label="Reset wait clock"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                onClick={() =>
                  remove("waiting_items", { id: w.id, previousData: w }, { mutationMode: "optimistic" })
                }
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                aria-label="Delete waiting item"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        <div className="flex flex-wrap gap-2 items-center p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Waiting for… (refund, callback, decision)"
            className="flex-1 min-w-40 h-8 text-sm"
          />
          <Input
            value={who}
            onChange={(e) => setWho(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="From whom?"
            className="w-32 h-8 text-sm"
          />
          <Button size="sm" variant="secondary" className="h-8 gap-1" onClick={add}>
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
      </Card>
    </section>
  );
};
