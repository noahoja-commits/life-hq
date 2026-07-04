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
  Plus,
  Trash2,
  ExternalLink,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { NextActions } from "../todos/NextActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "../misc/useConfirm";

const STATUSES = [
  "idea",
  "building",
  "launched",
  "paused",
  "archived",
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_META: Record<Status, { label: string; color: string }> = {
  idea: { label: "Idea", color: "var(--primary)" },
  building: { label: "Building", color: "var(--warning)" },
  launched: { label: "Launched", color: "var(--success)" },
  paused: { label: "Paused", color: "var(--muted-foreground)" },
  archived: { label: "Archived", color: "var(--muted-foreground)" },
};

interface Venture {
  id: number;
  name: string;
  emoji?: string;
  color?: string;
  status: Status;
  description?: string;
  url?: string;
  next_action?: string;
  position: number;
}

export const VenturesPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const [addOpen, setAddOpen] = useState(false);
  const { confirm, confirmUI } = useConfirm();

  const {
    data,
    refetch,
    isPending: venturesLoading,
  } = useGetList<Venture>("ventures", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "position", order: "ASC" },
  });
  const salesId = identity?.id ? Number(identity.id) : null;
  const ventures = data ?? [];

  const setStatus = (v: Venture, status: Status) =>
    update(
      "ventures",
      { id: v.id, data: { status }, previousData: v },
      { onSuccess: () => refetch() },
    );

  const del = (v: Venture) =>
    remove(
      "ventures",
      { id: v.id, previousData: v },
      { onSuccess: () => refetch() },
    );

  // Show active statuses first
  const order: Status[] = [
    "building",
    "idea",
    "launched",
    "paused",
    "archived",
  ];
  const present = order.filter((s) => ventures.some((v) => v.status === s));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Ventures</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> New venture
        </Button>
      </div>

      {venturesLoading && ventures.length === 0 ? (
        <CardsSkeleton count={4} />
      ) : ventures.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-[13px] text-muted-foreground">
          No ventures yet. Add the businesses and big projects you're running.
        </div>
      ) : (
        present.map((status) => (
          <section key={status} className="mb-8">
            <h2 className="u-label mb-3 flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: STATUS_META[status].color }}
              />
              {STATUS_META[status].label}
              <span className="ml-0.5 font-medium text-muted-foreground/60">
                {ventures.filter((v) => v.status === status).length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ventures
                .filter((v) => v.status === status)
                .map((v) => (
                  <VentureCard
                    key={v.id}
                    v={v}
                    onStatus={(s) => setStatus(v, s)}
                    onDelete={() =>
                      confirm(`Delete "${v.name}"?`, () => del(v))
                    }
                  />
                ))}
            </div>
          </section>
        ))
      )}

      {addOpen && (
        <AddVentureDialog
          onClose={() => setAddOpen(false)}
          onAdd={(payload) =>
            create(
              "ventures",
              {
                data: {
                  ...payload,
                  sales_id: salesId,
                  position: ventures.length,
                },
              },
              {
                onSuccess: () => {
                  setAddOpen(false);
                  refetch();
                },
                onError: () =>
                  notify("Could not add venture", { type: "error" }),
              },
            )
          }
        />
      )}
      {confirmUI}
    </div>
  );
};

VenturesPage.path = "/ventures";

const VentureCard = ({
  v,
  onStatus,
  onDelete,
}: {
  v: Venture;
  onStatus: (s: Status) => void;
  onDelete: () => void;
}) => {
  const [showActions, setShowActions] = useState(false);
  return (
    <Card
      className="p-5 flex flex-col gap-3 border-l-4"
      style={{ borderLeftColor: v.color ?? STATUS_META[v.status].color }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{v.emoji}</span>
        <span className="text-lg font-semibold flex-1 truncate">{v.name}</span>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete venture"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {v.description && (
        <p className="text-sm text-muted-foreground">{v.description}</p>
      )}

      {v.next_action && (
        <div className="flex items-start gap-2 text-sm">
          <ArrowRight className="size-4 text-primary shrink-0 mt-0.5" />
          <span>{v.next_action}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-1">
        <Select value={v.status} onValueChange={(s) => onStatus(s as Status)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {v.url && (
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm text-primary hover:underline flex items-center gap-1"
          >
            Open <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      <button
        onClick={() => setShowActions((s) => !s)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground self-start"
      >
        <ChevronDown
          className={
            showActions
              ? "size-3.5 rotate-180 transition-transform"
              : "size-3.5 transition-transform"
          }
        />
        Next actions
      </button>
      {showActions && (
        <NextActions filterField="venture_id" refId={v.id} compact />
      )}
    </Card>
  );
};

const AddVentureDialog = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (payload: {
    name: string;
    emoji: string;
    status: Status;
    description: string | null;
    url: string | null;
    next_action: string | null;
  }) => void;
}) => {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [status, setStatus] = useState<Status>("building");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [nextAction, setNextAction] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New venture</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              className="w-16"
              placeholder="🚀"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            />
            <Input
              autoFocus
              placeholder="Venture name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(s) => setStatus(s as Status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            rows={2}
            placeholder="What is it?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            placeholder="Next action"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
          />
          <Input
            placeholder="Link (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                name.trim() &&
                onAdd({
                  name: name.trim(),
                  emoji: emoji.trim(),
                  status,
                  description: description.trim() || null,
                  url: url.trim()
                    ? /^https?:\/\//.test(url)
                      ? url.trim()
                      : `https://${url.trim()}`
                    : null,
                  next_action: nextAction.trim() || null,
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
