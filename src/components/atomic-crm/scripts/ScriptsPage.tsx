import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import { Plus, Trash2, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useConfirm } from "../misc/useConfirm";
import { CardsSkeleton } from "../misc/CardsSkeleton";

export interface Script {
  id: number;
  title: string;
  emoji?: string;
  category: string;
  body: string;
  position: number;
}

export const SCRIPT_CATEGORIES = [
  "Calls",
  "Interviews",
  "Emails",
  "Texts",
  "General",
];

/** Open a script in a small floating browser window (readable mid-call). */
export const popOutScript = (id: number) => {
  window.open(
    `${window.location.origin}${window.location.pathname}#/script-pop/${id}`,
    `script-${id}`,
    "width=440,height=680,popup=yes,resizable=yes,scrollbars=yes",
  );
};

export const ScriptsPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const { confirm, confirmUI } = useConfirm();
  const [cat, setCat] = useState("All");
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data, isPending } = useGetList<Script>("scripts", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "position", order: "ASC" },
  });
  const scripts = (data ?? []).filter(
    (s) => cat === "All" || s.category === cat,
  );

  const addScript = (category: string) =>
    create(
      "scripts",
      {
        data: {
          title: "New script",
          category: category === "All" ? "General" : category,
          body: "",
          sales_id: salesId,
          position: (data ?? []).length,
        },
      },
      { onError: () => notify("Could not add script", { type: "error" }) },
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Scripts</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Call openers, interview answers, follow-ups — pop one out into a
            floating window and read it mid-call. The AI section can draft these
            for you.
          </p>
        </div>
        <Button onClick={() => addScript(cat)} className="gap-1">
          <Plus className="size-4" /> New script
        </Button>
      </div>

      <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto rounded-md bg-muted p-0.5">
        {["All", ...SCRIPT_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-[5px] px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
              cat === c
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {isPending && scripts.length === 0 ? (
        <CardsSkeleton count={3} className="grid grid-cols-1 gap-2" />
      ) : scripts.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-[13px] text-muted-foreground">
          No scripts yet. Add one, or ask the AI section to draft a cold-call
          opener — its replies have a "Save as script" button.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {scripts.map((s) => (
            <ScriptCard
              key={s.id}
              script={s}
              onPatch={(d) =>
                update(
                  "scripts",
                  {
                    id: s.id,
                    data: { ...d, updated_at: new Date().toISOString() },
                    previousData: s,
                  },
                  { mutationMode: "optimistic" },
                )
              }
              onDelete={() =>
                confirm(`Delete "${s.title}"?`, () =>
                  remove(
                    "scripts",
                    { id: s.id, previousData: s },
                    { mutationMode: "optimistic" },
                  ),
                )
              }
              onCopy={() => {
                navigator.clipboard.writeText(s.body).then(
                  () => notify("Copied to clipboard", { type: "info" }),
                  () => notify("Could not copy", { type: "error" }),
                );
              }}
            />
          ))}
        </div>
      )}
      {confirmUI}
    </div>
  );
};

ScriptsPage.path = "/scripts";

const ScriptCard = ({
  script,
  onPatch,
  onDelete,
  onCopy,
}: {
  script: Script;
  onPatch: (d: Partial<Script>) => void;
  onDelete: () => void;
  onCopy: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(script.title);
  const [body, setBody] = useState(script.body);

  return (
    <Card className="gap-2 p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
          <span className="truncate text-[13px] font-medium">
            {script.title}
          </span>
          <span className="u-label shrink-0 rounded-md border px-2 py-0.5 text-muted-foreground">
            {script.category}
          </span>
        </button>
        <button
          onClick={onCopy}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          title="Copy text"
          aria-label="Copy script text"
        >
          <Copy className="size-3.5" />
        </button>
        <button
          onClick={() => popOutScript(script.id)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-primary"
          title="Pop out into a floating window"
          aria-label="Pop out script"
        >
          <ExternalLink className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-destructive"
          aria-label="Delete script"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {!expanded && script.body && (
        <p className="line-clamp-2 pl-[22px] text-xs whitespace-pre-line text-muted-foreground">
          {script.body}
        </p>
      )}

      {expanded && (
        <div className="flex flex-col gap-2 pl-[22px]">
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() =>
                title.trim() &&
                title !== script.title &&
                onPatch({ title: title.trim() })
              }
              className="h-9 flex-1 text-[13px]"
              aria-label="Script title"
            />
            <select
              value={script.category}
              onChange={(e) => onPatch({ category: e.target.value })}
              className="rounded-md border bg-transparent px-2 text-xs"
              aria-label="Category"
            >
              {SCRIPT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={() => body !== script.body && onPatch({ body })}
            placeholder="Write the script — saves when you click away."
            className="min-h-40 resize-y text-[13px] leading-6"
          />
        </div>
      )}
    </Card>
  );
};
