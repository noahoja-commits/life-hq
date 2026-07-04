import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useCreate, useGetIdentity, useNotify, useRedirect } from "ra-core";
import { CheckSquare, Inbox, LayoutGrid, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useHaptics } from "@/hooks/useHaptics";
import { parseNaturalTask } from "../misc/parseNaturalTask";

/**
 * Share-from-anywhere landing: /#/capture?text=...&url=...&title=...
 * Made for an iOS Shortcut in the share sheet (share_target is Android-only).
 * Prefills whatever was shared; one tap files it as a to-do, Someday idea,
 * or Hub link.
 */
export const CaptureRoute = () => {
  const [params] = useSearchParams();
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const redirect = useRedirect();
  const haptic = useHaptics();
  const [create] = useCreate();

  const sharedUrl = params.get("url") ?? "";
  const initial = [params.get("title"), params.get("text"), sharedUrl]
    .filter(Boolean)
    .join(" ")
    .trim();
  const [text, setText] = useState(initial);
  useEffect(() => setText(initial), [initial]);

  const salesId = identity?.id ? Number(identity.id) : null;
  const parsed = text.trim() ? parseNaturalTask(text.trim()) : null;

  const done = (msg: string) => {
    haptic("success");
    notify(msg, { type: "info" });
    redirect("/");
  };

  const asTodo = () => {
    if (!parsed) return;
    create(
      "todos",
      {
        data: {
          text: parsed.text,
          notes: sharedUrl && !parsed.text.includes(sharedUrl) ? sharedUrl : null,
          due_date: parsed.due_date,
          priority: parsed.priority,
          sales_id: salesId,
          position: 0,
        },
      },
      { onSuccess: () => done("Filed as a to-do ✓") },
    );
  };

  const asSomeday = () => {
    if (!text.trim()) return;
    create(
      "deals",
      { data: { name: text.trim(), stage: "someday", sales_id: salesId } },
      { onSuccess: () => done("Captured to Someday ✓") },
    );
  };

  const asHubLink = () => {
    if (!sharedUrl) return;
    create(
      "hub_items",
      {
        data: {
          title: params.get("title") || params.get("text") || sharedUrl,
          url: sharedUrl,
          kind: "link",
          category: "Captured",
          sales_id: salesId,
          position: 999,
        },
      },
      { onSuccess: () => done("Saved to Hub ✓") },
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Capture</h1>
      </div>

      <Card className="p-4 flex flex-col gap-3">
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What landed in your head?"
          className="min-h-20 text-base resize-y"
        />
        {parsed?.due_date && (
          <span className="text-xs text-primary -mt-1">
            Due {parsed.due_date}
            {parsed.priority === 2 ? " · high priority" : ""}
          </span>
        )}
        <Button onClick={asTodo} disabled={!text.trim()} className="gap-2 h-11 rounded-xl">
          <CheckSquare className="size-4" /> Add as to-do
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={asSomeday}
            disabled={!text.trim()}
            className="gap-2 rounded-xl"
          >
            <Inbox className="size-4" /> Someday
          </Button>
          <Button
            variant="secondary"
            onClick={asHubLink}
            disabled={!sharedUrl}
            className="gap-2 rounded-xl"
          >
            <LayoutGrid className="size-4" /> Hub link
          </Button>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">
        Tip: add an iOS Shortcut that opens
        {" "}
        <code className="bg-muted rounded px-1">…/#/capture?text=[Shortcut Input]</code>
        {" "}
        to share into Life HQ from any app.
      </p>
    </div>
  );
};

CaptureRoute.path = "/capture";
