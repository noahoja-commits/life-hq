import { WhereIsItSection } from "./WhereIsIt";
import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useDelete,
  useNotify,
} from "ra-core";
import {
  Database,
  ExternalLink,
  Link as LinkIcon,
  LayoutGrid,
  Maximize2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface HubItem {
  id: number;
  sales_id: number | null;
  title: string;
  url: string;
  category: string;
  kind: "embed" | "link" | "database";
  description?: string;
  color?: string;
  position: number;
}

const KIND_ICON = {
  embed: Maximize2,
  link: ExternalLink,
  database: Database,
} as const;

// Normalize Google Sheets/Docs/Slides "edit" URLs into an embeddable /preview
// form so they render inside an iframe (edit URLs set X-Frame-Options).
const toEmbedUrl = (url: string): string => {
  const gdoc = url.match(
    /https:\/\/docs\.google\.com\/(spreadsheets|document|presentation)\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (gdoc) {
    return `https://docs.google.com/${gdoc[1]}/d/${gdoc[2]}/preview`;
  }
  return url;
};

export const HubPage = () => {
  const { data, isLoading, refetch } = useGetList<HubItem>("hub_items", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "position", order: "ASC" },
  });
  const [embedItem, setEmbedItem] = useState<HubItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const items = data ?? [];
  const categories = Array.from(new Set(items.map((i) => i.category)));

  const openItem = (item: HubItem) => {
    if (item.kind === "embed") {
      setEmbedItem(item);
    } else {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Command Center</h1>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> Add tile
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading your tools…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">
          No tiles yet. Add your first website, dashboard, or database.
        </p>
      ) : (
        categories.map((cat) => (
          <section key={cat} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {cat}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items
                .filter((i) => i.category === cat)
                .map((item) => (
                  <HubTile
                    key={item.id}
                    item={item}
                    onOpen={() => openItem(item)}
                    onDeleted={refetch}
                  />
                ))}
            </div>
          </section>
        ))
      )}

      {embedItem && (
        <EmbedDialog item={embedItem} onClose={() => setEmbedItem(null)} />
      )}
      {addOpen && (
        <AddTileDialog
          existingCategories={categories}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            refetch();
          }}
        />
      )}
      <WhereIsItSection />
    </div>
  );
};

HubPage.path = "/hub";

const HubTile = ({
  item,
  onOpen,
  onDeleted,
}: {
  item: HubItem;
  onOpen: () => void;
  onDeleted: () => void;
}) => {
  const [deleteOne] = useDelete();
  const notify = useNotify();
  const Icon = KIND_ICON[item.kind] ?? LinkIcon;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteOne(
      "hub_items",
      { id: item.id, previousData: item },
      {
        onSuccess: () => {
          notify("Tile removed", { type: "info" });
          onDeleted();
        },
        onError: () => notify("Could not remove tile", { type: "error" }),
      },
    );
  };

  return (
    <Card
      onClick={onOpen}
      className="group relative cursor-pointer p-4 flex flex-col gap-2 hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: item.color ?? "var(--primary)" }}
    >
      <button
        onClick={handleDelete}
        className="absolute top-1 right-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        aria-label="Remove tile"
      >
        <Trash2 className="size-4" />
      </button>
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-medium text-sm truncate">{item.title}</span>
      </div>
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </p>
      )}
    </Card>
  );
};

const EmbedDialog = ({
  item,
  onClose,
}: {
  item: HubItem;
  onClose: () => void;
}) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
      <DialogHeader className="flex-row items-center justify-between px-4 py-2 border-b space-y-0">
        <DialogTitle className="text-base">{item.title}</DialogTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              window.open(item.url, "_blank", "noopener,noreferrer")
            }
            className="gap-1"
          >
            <ExternalLink className="size-4" /> Open
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </DialogHeader>
      <iframe
        src={toEmbedUrl(item.url)}
        title={item.title}
        className="flex-1 w-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
      <p className="text-[0.7rem] text-muted-foreground px-4 py-1 border-t">
        If this stays blank, the site blocks embedding — use "Open" to launch it
        in a new tab.
      </p>
    </DialogContent>
  </Dialog>
);

const AddTileDialog = ({
  existingCategories,
  onClose,
  onAdded,
}: {
  existingCategories: string[];
  onClose: () => void;
  onAdded: () => void;
}) => {
  const { identity } = useGetIdentity();
  const [create] = useCreate();
  const notify = useNotify();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState(existingCategories[0] ?? "Tools");
  const [kind, setKind] = useState<"embed" | "link" | "database">("embed");

  const submit = () => {
    if (!title || !url) {
      notify("Title and URL are required", { type: "warning" });
      return;
    }
    const normalizedUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;
    create(
      "hub_items",
      {
        data: {
          title,
          url: normalizedUrl,
          category,
          kind,
          sales_id: identity?.id ? Number(identity.id) : null,
          position: 999,
        },
      },
      {
        onSuccess: () => {
          notify("Tile added", { type: "info" });
          onAdded();
        },
        onError: () => notify("Could not add tile", { type: "error" }),
      },
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a tile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Title (e.g. My Dashboard)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="URL (e.g. myapp.vercel.app)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="embed">Embed (live panel)</SelectItem>
              <SelectItem value="link">Link (open in new tab)</SelectItem>
              <SelectItem value="database">Database</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit}>Add tile</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
