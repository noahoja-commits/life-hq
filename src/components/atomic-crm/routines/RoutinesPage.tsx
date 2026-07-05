import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import { Plus, Trash2, X, Bell, Repeat } from "lucide-react";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "../misc/useConfirm";
import { useUndoable } from "../misc/useUndoable";
import { usePageHotkey } from "../misc/usePageHotkey";
import { EmptyState } from "../misc/EmptyState";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";
import { Heatmap } from "../track/Heatmap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Routine {
  id: number;
  name: string;
  emoji?: string;
  color?: string;
  position: number;
  remind_time?: string | null;
}
interface Step {
  id: number;
  routine_id: number;
  text: string;
  position: number;
}
interface Check {
  id: number;
  step_id: number;
  checked_on: string;
}

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const RoutinesPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const { deleteWithUndo } = useUndoable();
  const [addOpen, setAddOpen] = useState(false);
  const { confirm, confirmUI } = useConfirm();
  const haptic = useHaptics();
  usePageHotkey("n", () => setAddOpen(true));
  const today = localToday();

  const { data: routines, isPending: routinesLoading } = useGetList<Routine>(
    "routines",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "position", order: "ASC" },
    },
  );
  const { data: steps } = useGetList<Step>("routine_steps", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: checks } = useGetList<Check>("routine_checks", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "checked_on", order: "DESC" },
  });

  const salesId = identity?.id ? Number(identity.id) : null;
  const allRoutines = routines ?? [];
  const allSteps = steps ?? [];
  const todayChecks = (checks ?? []).filter((c) => c.checked_on === today);
  const checkByStep = new Map(todayChecks.map((c) => [c.step_id, c]));

  const toggle = (step: Step) => {
    const existing = checkByStep.get(step.id);
    haptic(existing ? "tick" : "success");
    if (existing) {
      remove(
        "routine_checks",
        { id: existing.id, previousData: existing },
        { mutationMode: "optimistic" },
      );
    } else {
      create("routine_checks", {
        data: { step_id: step.id, sales_id: salesId, checked_on: today },
      });
    }
  };

  const addStep = (routineId: number, text: string) =>
    create(
      "routine_steps",
      {
        data: {
          routine_id: routineId,
          sales_id: salesId,
          text,
          position: allSteps.length,
        },
      },
      { onError: () => notify("Could not add", { type: "error" }) },
    );

  const delStep = (step: Step) =>
    remove(
      "routine_steps",
      { id: step.id, previousData: step },
      { mutationMode: "optimistic" },
    );

  const delRoutine = (r: Routine) =>
    deleteWithUndo("routines", { id: r.id, previousData: r });

  const setRemindTime = (r: Routine, remind_time: string | null) =>
    update(
      "routines",
      { id: r.id, data: { remind_time }, previousData: r },
      { mutationMode: "optimistic" },
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> New routine
        </Button>
      </div>

      {routinesLoading && allRoutines.length === 0 ? (
        <CardsSkeleton
          count={3}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        />
      ) : allRoutines.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No routines yet"
          description="Build a morning or wind-down flow — check off what you get to, skip the rest, no guilt."
          action={{ label: "New routine", onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRoutines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              steps={allSteps.filter((s) => s.routine_id === routine.id)}
              checkByStep={checkByStep}
              allChecks={checks ?? []}
              onToggle={toggle}
              onAddStep={(t) => addStep(routine.id, t)}
              onDelStep={delStep}
              onDelRoutine={() =>
                confirm(`Delete "${routine.name}" and its steps?`, () =>
                  delRoutine(routine),
                )
              }
              onRemindTime={(t) => setRemindTime(routine, t)}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <AddRoutineDialog
          onClose={() => setAddOpen(false)}
          onAdd={(name, emoji) =>
            create(
              "routines",
              {
                data: {
                  name,
                  emoji,
                  sales_id: salesId,
                  position: allRoutines.length,
                },
              },
              {
                onSuccess: () => setAddOpen(false),
                onError: () =>
                  notify("Could not add routine", { type: "error" }),
              },
            )
          }
        />
      )}
      {confirmUI}
    </div>
  );
};

RoutinesPage.path = "/routines";

const RoutineCard = ({
  routine,
  steps,
  checkByStep,
  allChecks,
  onToggle,
  onAddStep,
  onDelStep,
  onDelRoutine,
  onRemindTime,
}: {
  routine: Routine;
  steps: Step[];
  checkByStep: Map<number, Check>;
  allChecks: Check[];
  onToggle: (step: Step) => void;
  onAddStep: (text: string) => void;
  onDelStep: (step: Step) => void;
  onDelRoutine: () => void;
  onRemindTime: (t: string | null) => void;
}) => {
  const [text, setText] = useState("");
  const doneCount = steps.filter((s) => checkByStep.has(s.id)).length;
  const add = () => {
    if (text.trim()) {
      onAddStep(text.trim());
      setText("");
    }
  };

  // Rhythm strip: steps of THIS routine checked per calendar day.
  const stepIds = new Set(steps.map((s) => s.id));
  const perDay = new Map<string, number>();
  for (const c of allChecks) {
    if (stepIds.has(c.step_id)) {
      perDay.set(c.checked_on, (perDay.get(c.checked_on) ?? 0) + 1);
    }
  }
  return (
    <Card
      className="p-4 flex flex-col gap-3 border-t-4"
      style={{ borderTopColor: routine.color ?? "var(--primary)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{routine.emoji}</span>
        <span className="flex-1 truncate text-[13px] font-semibold">
          {routine.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{steps.length} today
        </span>
        <button
          onClick={onDelRoutine}
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Delete routine"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {steps.length > 0 && (
        <div className="divide-y divide-border overflow-hidden rounded-md border">
          {steps.map((step) => {
            const done = checkByStep.has(step.id);
            return (
              <div
                key={step.id}
                className="group flex items-center gap-2 px-2.5 py-2 transition-colors hover:bg-accent/50"
              >
                <Checkbox
                  checked={done}
                  onCheckedChange={() => onToggle(step)}
                />
                <span
                  className={cn(
                    "flex-1 text-[13px]",
                    done && "text-muted-foreground line-through",
                  )}
                >
                  {step.text}
                </span>
                <button
                  onClick={() => onDelStep(step)}
                  className="text-muted-foreground opacity-60 transition-colors hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add step…"
          className="h-9"
        />
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9"
          onClick={add}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Daily nudge (fires at this local time on the routine's days) */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Bell className="size-3.5 shrink-0" />
        <span>Nudge</span>
        <input
          type="time"
          value={(routine.remind_time ?? "").slice(0, 5)}
          onChange={(e) => onRemindTime(e.target.value || null)}
          className="rounded-md border bg-transparent px-2 py-1"
          aria-label="Daily nudge time"
        />
        {routine.remind_time && (
          <button
            onClick={() => onRemindTime(null)}
            className="underline transition-colors hover:text-destructive"
          >
            off
          </button>
        )}
      </div>

      {perDay.size > 0 && (
        <div className="mt-1">
          <Heatmap
            dayValue={(d) => perDay.get(d) ?? 0}
            weeks={8}
            accent={routine.color ?? "var(--primary)"}
            size="sm"
          />
          <p className="text-[10px] text-muted-foreground">
            8-week rhythm — no streaks, just showing up
          </p>
        </div>
      )}
    </Card>
  );
};

const AddRoutineDialog = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, emoji: string) => void;
}) => {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New routine</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            className="w-16"
            placeholder="🌅"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <Input
            autoFocus
            placeholder="Routine name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && name.trim() && onAdd(name.trim(), emoji)
            }
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => name.trim() && onAdd(name.trim(), emoji)}>
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
