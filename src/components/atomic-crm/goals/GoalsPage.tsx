import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import { Plus, Trash2, X, Trophy, Pause, Play, Target, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useConfirm } from "../misc/useConfirm";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { EmptyState } from "../misc/EmptyState";
import { useUndoable } from "../misc/useUndoable";
import { usePageHotkey } from "../misc/usePageHotkey";

export interface Goal {
  id: number;
  title: string;
  emoji?: string;
  why?: string;
  target_date?: string | null;
  status: "active" | "achieved" | "parked";
  color?: string | null;
  position: number;
}
export interface Milestone {
  id: number;
  goal_id: number;
  text: string;
  done: boolean;
  position: number;
}

export const GoalsPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const haptic = useHaptics();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const { confirm, confirmUI } = useConfirm();
  const { deleteWithUndo } = useUndoable();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const salesId = identity?.id ? Number(identity.id) : null;
  usePageHotkey("n", () => setAddOpen(true));

  const { data: goals, isPending } = useGetList<Goal>("goals", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: milestones } = useGetList<Milestone>("goal_milestones", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "position", order: "ASC" },
  });

  const all = goals ?? [];
  const groups: { status: Goal["status"]; label: string }[] = [
    { status: "active", label: "In pursuit" },
    { status: "parked", label: "Parked (no guilt)" },
    { status: "achieved", label: "Achieved" },
  ];

  const itemMatchesSearch = (item: Goal, q: string) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    const fields = [item.title, item.why];
    return fields.some((f) => f && String(f).toLowerCase().includes(s));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold tracking-tight">Goals</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> New goal
        </Button>
      </div>
      <p className="text-[13px] text-muted-foreground mb-6">
        Where you're headed — broken into steps small enough to actually take.
      </p>

      {/* Search */}
      <div className="relative w-full max-w-xs mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      {isPending && all.length === 0 ? (
        <CardsSkeleton
          count={4}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        />
      ) : all.length === 0 ? (
        search.trim() ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No goals match your search.
          </p>
        ) : (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set a goal, break it into milestones, and track your progress."
            action={{ label: "Set a goal", onClick: () => setAddOpen(true) }}
          />
        )
      ) : (
        (() => {
          const filtered = search.trim()
            ? all.filter((g) => itemMatchesSearch(g, search))
            : all;
          if (filtered.length === 0) {
            return (
              <p className="text-sm text-muted-foreground text-center py-8">
                No goals match your search.
              </p>
            );
          }
          return groups
            .filter((g) => filtered.some((goal) => goal.status === g.status))
            .map((g) => (
              <section key={g.status} className="mb-8">
                <h2 className="u-label mb-3 text-muted-foreground">{g.label}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered
                    .filter((goal) => goal.status === g.status)
                    .map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        milestones={(milestones ?? []).filter(
                          (m) => m.goal_id === goal.id,
                        )}
                        salesId={salesId}
                        onPatch={(d) =>
                          update(
                            "goals",
                            { id: goal.id, data: d, previousData: goal },
                            { mutationMode: "optimistic" },
                          )
                        }
                        onDelete={() =>
                          deleteWithUndo("goals", {
                            id: goal.id,
                            previousData: goal,
                          })
                        }
                        onToggleMilestone={(m) => {
                          haptic(m.done ? "tick" : "success");
                          update(
                            "goal_milestones",
                            {
                              id: m.id,
                              data: { done: !m.done },
                              previousData: m,
                            },
                            { mutationMode: "optimistic" },
                          );
                        }}
                        onAddMilestone={(text) =>
                          create("goal_milestones", {
                            data: {
                              goal_id: goal.id,
                              text,
                              sales_id: salesId,
                              position: (milestones ?? []).filter(
                                (m) => m.goal_id === goal.id,
                              ).length,
                            },
                          })
                        }
                        onDelMilestone={(m) =>
                          remove(
                            "goal_milestones",
                            { id: m.id, previousData: m },
                            { mutationMode: "optimistic" },
                          )
                        }
                      />
                    ))}
                </div>
              </section>
            ));
        })()
      )}

      {addOpen && (
        <AddGoalDialog
          onClose={() => setAddOpen(false)}
          onAdd={(payload) =>
            create(
              "goals",
              { data: { ...payload, sales_id: salesId, position: all.length } },
              {
                onSuccess: () => setAddOpen(false),
                onError: () => notify("Could not add goal", { type: "error" }),
              },
            )
          }
        />
      )}
      {confirmUI}
    </div>
  );
};

GoalsPage.path = "/goals";

const GoalCard = ({
  goal,
  milestones,
  onPatch,
  onDelete,
  onToggleMilestone,
  onAddMilestone,
  onDelMilestone,
}: {
  goal: Goal;
  milestones: Milestone[];
  salesId: number | null;
  onPatch: (d: Partial<Goal>) => void;
  onDelete: () => void;
  onToggleMilestone: (m: Milestone) => void;
  onAddMilestone: (text: string) => void;
  onDelMilestone: (m: Milestone) => void;
}) => {
  const [text, setText] = useState("");
  const done = milestones.filter((m) => m.done).length;
  const pct = milestones.length
    ? Math.round((done / milestones.length) * 100)
    : 0;
  const add = () => {
    if (!text.trim()) return;
    onAddMilestone(text.trim());
    setText("");
  };

  return (
    <Card
      className="p-4 flex flex-col gap-3 border-t-4"
      style={{ borderTopColor: goal.color ?? "var(--primary)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{goal.emoji}</span>
        <span className="font-semibold flex-1 truncate">{goal.title}</span>
        {goal.status === "active" ? (
          <>
            <button
              onClick={() => onPatch({ status: "achieved" })}
              className="text-muted-foreground hover:text-warning"
              title="Mark achieved"
              aria-label="Mark achieved"
            >
              <Trophy className="size-4" />
            </button>
            <button
              onClick={() => onPatch({ status: "parked" })}
              className="text-muted-foreground hover:text-foreground"
              title="Park for now"
              aria-label="Park goal"
            >
              <Pause className="size-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onPatch({ status: "active" })}
            className="text-muted-foreground hover:text-success"
            title="Resume"
            aria-label="Resume goal"
          >
            <Play className="size-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete goal"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {goal.why && (
        <p className="text-sm text-muted-foreground italic">"{goal.why}"</p>
      )}

      {milestones.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor:
                  pct === 100 ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{milestones.length}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {milestones.map((m) => (
          <div key={m.id} className="group flex items-center gap-2">
            <Checkbox
              checked={m.done}
              onCheckedChange={() => onToggleMilestone(m)}
              className="transition-transform active:scale-90"
            />
            <span
              className={cn(
                "text-[13px] flex-1",
                m.done && "line-through text-muted-foreground",
              )}
            >
              {m.text}
            </span>
            <button
              onClick={() => onDelMilestone(m)}
              className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              aria-label="Remove milestone"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Next milestone…"
          className="h-9"
        />
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9"
          onClick={add}
          aria-label="Add milestone"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {goal.target_date && goal.status === "active" && (
        <p className="text-[11px] text-muted-foreground">
          Aiming for{" "}
          {new Date(goal.target_date + "T00:00:00").toLocaleDateString(
            undefined,
            {
              month: "long",
              day: "numeric",
              year: "numeric",
            },
          )}
        </p>
      )}
    </Card>
  );
};

const AddGoalDialog = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (p: {
    title: string;
    emoji: string;
    why: string;
    target_date: string | null;
    status: string;
  }) => void;
}) => {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [why, setWhy] = useState("");
  const [date, setDate] = useState("");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New goal</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              className="w-16"
              placeholder="🎯"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            />
            <Input
              autoFocus
              placeholder="What do you want?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <Textarea
            rows={2}
            placeholder="Why does it matter? (shown on the card as a reminder)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />
          <div className="flex items-center gap-2 text-sm">
            <label className="text-muted-foreground shrink-0">
              Target (optional)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border px-2 py-1 bg-transparent flex-1"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                title.trim() &&
                onAdd({
                  title: title.trim(),
                  emoji: emoji.trim(),
                  why: why.trim(),
                  target_date: date || null,
                  status: "active",
                })
              }
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
