import { useGetList, useCreate, useDelete, useNotify, useGetIdentity } from "ra-core";
import { Link as LinkIcon, Plus, Trash2, ExternalLink } from "lucide-react";
import { useRedirect } from "ra-core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────

interface LinkRow {
  id: number;
  source_type: string;
  source_id: number;
  target_type: string;
  target_id: number;
  label?: string;
}

interface ConnectionPanelProps {
  /** The entity type we're viewing (e.g. "ventures", "contacts") */
  entityType: string;
  /** The entity ID */
  entityId: number;
  /** Optional className */
  className?: string;
}

// ── Labels & icons per type ─────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  contacts: "Contact",
  companies: "Company",
  deals: "Project",
  ventures: "Venture",
  todos: "Todo",
  applications: "Application",
  goals: "Goal",
  pages: "Page",
  hub_items: "Hub",
  scripts: "Script",
};

const TYPE_ICON: Record<string, string> = {
  contacts: "👤",
  companies: "🏢",
  deals: "📋",
  ventures: "🚀",
  todos: "✅",
  applications: "💼",
  goals: "🎯",
  pages: "📄",
  hub_items: "🔗",
  scripts: "📝",
};

const LINKABLE_TYPES = Object.keys(TYPE_LABEL);

// ── Resolve a linked entity to a display label ──────────

const useResolvedLabel = (type: string, id: number): string => {
  const { data } = useGetList<any>(type, {
    pagination: { page: 1, perPage: 1 },
    filter: { id },
  });
  const item = data?.[0];
  if (!item) return `${type} #${id}`;
  switch (type) {
    case "contacts":
      return [item.first_name, item.last_name].filter(Boolean).join(" ") || "Contact";
    case "companies":
      return item.name || "Company";
    default:
      return item.name || item.title || item.text || `${type} #${id}`;
  }
};

// ── LinkedItem row ──────────────────────────────────────

const LinkedItem = ({
  link,
  onRemove,
}: {
  link: LinkRow;
  onRemove: () => void;
}) => {
  const isSource = true; // we show the other end
  const otherType = link.source_type;
  const label = useResolvedLabel(otherType, link.source_id);
  const icon = TYPE_ICON[otherType] || "📦";
  const typeLabel = TYPE_LABEL[otherType] || otherType;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-ring">
      <span className="text-base">{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="truncate font-medium">{label}</span>
        <span className="ml-1.5 text-xs text-muted-foreground">{typeLabel}</span>
        {link.label && (
          <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {link.label}
          </span>
        )}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove link"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
};

// ── Main Panel ──────────────────────────────────────────

export const ConnectionPanel = ({
  entityType,
  entityId,
  className,
}: ConnectionPanelProps) => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [remove] = useDelete();
  const salesId = identity?.id ? Number(identity.id) : null;

  const [adding, setAdding] = useState(false);
  const [linkType, setLinkType] = useState(LINKABLE_TYPES[0]);
  const [linkId, setLinkId] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  // Fetch links where this entity is the target
  const { data: incoming, refetch: refetchIncoming } = useGetList<LinkRow>("links", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "created_at", order: "DESC" },
    filter: { target_type: entityType, target_id: entityId },
  });

  // Fetch links where this entity is the source
  const { data: outgoing, refetch: refetchOutgoing } = useGetList<LinkRow>("links", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "created_at", order: "DESC" },
    filter: { source_type: entityType, source_id: entityId },
  });

  const allLinks = [
    ...(incoming ?? []).map((l) => ({ ...l, _dir: "in" as const })),
    ...(outgoing ?? []).map((l) => ({ ...l, _dir: "out" as const })),
  ];

  const addLink = () => {
    const id = parseInt(linkId, 10);
    if (!id || id === entityId) {
      notify("Enter a valid entity ID", { type: "error" });
      return;
    }
    create(
      "links",
      {
        data: {
          source_type: entityType,
          source_id: entityId,
          target_type: linkType,
          target_id: id,
          label: linkLabel || null,
          sales_id: salesId,
        },
      },
      {
        onSuccess: () => {
          notify("Linked", { type: "success" });
          setAdding(false);
          setLinkId("");
          setLinkLabel("");
          refetchIncoming();
          refetchOutgoing();
        },
        onError: () => notify("Could not link — may already exist", { type: "error" }),
      },
    );
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Connections</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding(!adding)}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="size-3" />
          Link
        </Button>
      </div>

      {adding && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-muted/50 p-2">
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            className="h-8 rounded border border-input bg-background px-2 text-xs"
          >
            {LINKABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <Input
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            placeholder="ID"
            className="h-8 w-20 text-xs"
          />
          <Input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Label (optional)"
            className="h-8 w-32 text-xs"
          />
          <Button size="sm" onClick={addLink} className="h-8 text-xs">
            Add
          </Button>
        </div>
      )}

      {allLinks.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground">
          No connections yet. Link this to a contact, venture, goal, or anything else.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {allLinks.map((link) => (
            <LinkedItem
              key={link.id}
              link={link}
              onRemove={() =>
                remove("links", { id: link.id, previousData: link }, {
                  onSuccess: () => {
                    refetchIncoming();
                    refetchOutgoing();
                  },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
