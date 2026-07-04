import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import {
  ScrollText,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
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

export const SCRIPT_CATEGORIES = ["Calls", "Interviews", "Emails", "Texts", "General"];

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
  const scripts = (data ?? []).filter((s) => cat === "All" || s.category === cat);

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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <ScrollText className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold flex-1">Scripts</h1>
        <Button onClick={() => addScript(cat)} className="gap-1">
          <Plus className="size-4" /> New script
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Your words, ready to go — call openers, interview answers, follow-ups.
        Pop one out into a floating window and read it mid-call. The AI section
        can draft these for you.
      </p>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5">
        {["All", ...SCRIPT_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm border whitespace-nowrap transition-colors",
              cat === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {isPending && scripts.length === 0 ? (
        <CardsSkeleton count={3} className="grid grid-cols-1 gap-3" />
      ) : scripts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
          No scripts yet. Add one, or ask the AI section to draft a cold-call
          opener — its replies have a "Save as script" button.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {scripts.map((s) => (
            <ScriptCard
              key={s.id}
              script={s}
              onPatch={(d) =>
                update("scripts", { id: s.id, data: { ...d, updated_at: new Date().toISOString() }, previousData: s }, { mutationMode: "optimistic" })
              }
              onDelete={() =>
                confirm(`Delete "${s.title}"?`, () =>
                  remove("scripts", { id: s.id, previousData: s }, { mutationMode: "optimistic" }),
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
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          <span className="font-medium truncate">{script.title}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground rounded-full bg-accent px-2 py-0.5 shrink-0">
            {script.category}
          </span>
        </button>
        <button
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
          title="Copy text"
          aria-label="Copy script text"
        >
          <Copy className="size-4" />
        </button>
        <button
          onClick={() => popOutScript(script.id)}
          className="text-muted-foreground hover:text-primary"
          title="Pop out into a floating window"
          aria-label="Pop out script"
        >
          <ExternalLink className="size-4" />
        </button>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete script"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {!expanded && script.body && (
        <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line pl-6">
          {script.body}
        </p>
      )}

      {expanded && (
        <div className="flex flex-col gap-2 pl-6">
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== script.title && onPatch({ title: title.trim() })}
              className="flex-1 h-9"
              aria-label="Script title"
            />
            <select
              value={script.category}
              onChange={(e) => onPatch({ category: e.target.value })}
              className="rounded-md border bg-transparent px-2 text-sm"
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
            className="min-h-40 text-[15px] leading-6 resize-y"
          />
        </div>
      )}
    </Card>
  );
};
