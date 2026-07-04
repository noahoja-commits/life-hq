import { useState } from "react";
import { useGetList, useGetIdentity, useCreate, useUpdate } from "ra-core";
import { CheckSquare, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { parseNaturalTask } from "../misc/parseNaturalTask";
import { nextInstancePayload } from "../misc/recurrence";

interface Todo {
  id: number;
  text: string;
  due_date?: string | null;
  priority: number;
  done: boolean;
  notes?: string | null;
  position?: number;
  remind_at?: string | null;
  recur_freq?: "daily" | "weekly" | "monthly" | null;
  recur_byweekday?: number[] | null;
  recur_day_of_month?: number | null;
  recur_until?: string | null;
  project_id?: number | null;
  venture_id?: number | null;
  application_id?: number | null;
}

export type TodoLinkField = "project_id" | "venture_id" | "application_id";

/**
 * "Next actions" — the to-dos linked to a Project / Venture / Job via the
 * given FK, with inline pre-linked add and optimistic complete. Reused by
 * DealShow, VenturesPage, and ApplicationsPage.
 */
export const NextActions = ({
  filterField,
  refId,
  compact = false,
}: {
  filterField: TodoLinkField;
  refId: number;
  compact?: boolean;
}) => {
  const { identity } = useGetIdentity();
  const [create] = useCreate();
  const [update] = useUpdate();
  const haptic = useHaptics();
  const [text, setText] = useState("");

  const { data } = useGetList<Todo>("todos", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "DESC" },
    filter: { [filterField]: refId },
  });

  const todos = data ?? [];
  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const add = () => {
    const raw = text.trim();
    if (!raw) return;
    const parsed = parseNaturalTask(raw);
    haptic("tick");
    setText("");
    create(
      "todos",
      {
        data: {
          text: parsed.text,
          due_date: parsed.due_date,
          priority: parsed.priority,
          [filterField]: refId,
          sales_id: identity?.id ? Number(identity.id) : null,
          position: 0,
        },
      },
    );
  };

  const toggle = (t: Todo) => {
    const markingDone = !t.done;
    haptic(markingDone ? "success" : "tick");
    update(
      "todos",
      {
        id: t.id,
        data: { done: markingDone, done_at: markingDone ? new Date().toISOString() : null },
        previousData: t,
      },
      { mutationMode: "optimistic" },
    );
    if (markingDone) {
      const salesId = identity?.id ? Number(identity.id) : null;
      const nextInstance = nextInstancePayload(t, salesId, todos);
      if (nextInstance) create("todos", { data: nextInstance });
    }
  };

  const inputH = compact ? "h-8" : "h-8";

  return (
    <div>
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="size-4 text-primary" />
          <h3 className="text-sm font-medium">
            Next actions{open.length > 0 ? ` · ${open.length}` : ""}
          </h3>
        </div>
      )}
      <div className="flex gap-2 mb-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a next action…"
          className={cn(inputH, "text-sm")}
        />
        <Button
          size="icon"
          variant={compact ? "secondary" : "default"}
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={add}
          aria-label="Add next action"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {[...open, ...done.slice(0, compact ? 3 : 5)].map((t) => (
        <div key={t.id} className="flex items-center gap-2.5 py-1.5">
          <Checkbox
            checked={t.done}
            onCheckedChange={() => toggle(t)}
            aria-label={`Mark ${t.text} done`}
            className="transition-transform active:scale-90"
          />
          <span
            className={cn(
              "text-sm flex-1 truncate",
              t.done && "line-through text-muted-foreground",
            )}
          >
            {t.text}
          </span>
          {t.due_date && !t.done && (
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(t.due_date + "T00:00:00").toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
