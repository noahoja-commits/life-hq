import { useState } from "react";
import { useCreate, useGetIdentity, useNotify, useRedirect } from "ra-core";
import { Brain, CheckSquare, Inbox, Activity, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHaptics } from "@/hooks/useHaptics";
import { parseNaturalTask } from "../misc/parseNaturalTask";

/**
 * One-tap mobile capture: the FAB opens this sheet, keyboard comes up,
 * type -> Enter files a to-do (natural dates: "call mom tomorrow").
 * Secondary actions: save as Someday idea, jump to Track / Focus.
 */
export const QuickCaptureSheet = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const redirect = useRedirect();
  const haptic = useHaptics();
  const [create] = useCreate();
  const [text, setText] = useState("");
  const salesId = identity?.id ? Number(identity.id) : null;

  const close = () => {
    setText("");
    onOpenChange(false);
  };

  const addTodo = () => {
    const raw = text.trim();
    if (!raw) return;
    const parsed = parseNaturalTask(raw);
    haptic("success");
    close();
    create(
      "todos",
      {
        data: {
          text: parsed.text,
          due_date: parsed.due_date,
          priority: parsed.priority,
          sales_id: salesId,
          position: 0,
        },
      },
      {
        onSuccess: () =>
          notify(
            `Added to-do: ${parsed.text}${parsed.due_date ? ` (${parsed.due_date})` : ""}`,
            { type: "info" },
          ),
        onError: () => notify("Could not add to-do", { type: "error" }),
      },
    );
  };

  const addSomeday = () => {
    const raw = text.trim();
    if (!raw) return;
    haptic("tick");
    close();
    create(
      "deals",
      { data: { name: raw, stage: "someday", sales_id: salesId } },
      {
        onSuccess: () => notify(`Captured: ${raw}`, { type: "info" }),
        onError: () => notify("Could not capture", { type: "error" }),
      },
    );
  };

  const jump = (to: string) => {
    close();
    redirect(to);
  };

  const parsed = text.trim() ? parseNaturalTask(text.trim()) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Capture</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="What's on your mind? (e.g. call mom tomorrow)"
              className="h-11 rounded-xl text-base"
            />
            <Button
              onClick={addTodo}
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0"
              aria-label="Add to-do"
            >
              <Plus className="size-5" />
            </Button>
          </div>
          {parsed?.due_date && (
            <span className="text-xs text-primary -mt-1">
              Due {parsed.due_date}
              {parsed.priority === 2 ? " · high priority" : ""}
            </span>
          )}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={addSomeday}
              disabled={!text.trim()}
              className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-xs font-medium disabled:opacity-40 hover:bg-accent transition-colors"
            >
              <Inbox className="size-5 text-violet-400" />
              Someday idea
            </button>
            <button
              onClick={() => jump("/track")}
              className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-xs font-medium hover:bg-accent transition-colors"
            >
              <Activity className="size-5 text-emerald-400" />
              Log a tracker
            </button>
            <button
              onClick={() => jump("/focus")}
              className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-xs font-medium hover:bg-accent transition-colors"
            >
              <Brain className="size-5 text-indigo-400" />
              Start focus
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckSquare className="size-3" />
            Enter files it as a to-do — dates like "friday" are picked up
            automatically.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
