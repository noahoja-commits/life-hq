import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import { Plus, Trash2, X, Eraser, ListChecks } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface List {
  id: number;
  name: string;
  emoji?: string;
  color?: string;
  position: number;
}
interface ListItem {
  id: number;
  list_id: number;
  text: string;
  checked: boolean;
  position: number;
}

export const ListsPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const { deleteWithUndo } = useUndoable();
  const [addOpen, setAddOpen] = useState(false);
  const { confirmUI } = useConfirm();
  const haptic = useHaptics();
  usePageHotkey("n", () => setAddOpen(true));

  const { data: lists, isPending: listsLoading } = useGetList<List>("lists", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: items } = useGetList<ListItem>("list_items", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "position", order: "ASC" },
  });

  const salesId = identity?.id ? Number(identity.id) : null;
  const allLists = lists ?? [];
  const allItems = items ?? [];

  const addItem = (listId: number, text: string) =>
    create(
      "list_items",
      {
        data: {
          list_id: listId,
          sales_id: salesId,
          text,
          position: allItems.length,
        },
      },
      { onError: () => notify("Could not add", { type: "error" }) },
    );

  const toggle = (item: ListItem) => {
    haptic(item.checked ? "tick" : "success");
    update(
      "list_items",
      { id: item.id, data: { checked: !item.checked }, previousData: item },
      { mutationMode: "optimistic" },
    );
  };

  const delItem = (item: ListItem) =>
    remove(
      "list_items",
      { id: item.id, previousData: item },
      { mutationMode: "optimistic" },
    );

  const clearChecked = (listId: number) => {
    const checked = allItems.filter((i) => i.list_id === listId && i.checked);
    checked.forEach((i) =>
      remove(
        "list_items",
        { id: i.id, previousData: i },
        { mutationMode: "optimistic" },
      ),
    );
    if (checked.length) notify("Cleared checked", { type: "info" });
  };

  const delList = (list: List) =>
    deleteWithUndo("lists", { id: list.id, previousData: list });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Lists</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> New list
        </Button>
      </div>

      {listsLoading && allLists.length === 0 ? (
        <CardsSkeleton
          count={3}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        />
      ) : allLists.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No lists yet"
          description="Make a grocery list, a to-buy list, anything."
          action={{ label: "New list", onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              items={allItems.filter((i) => i.list_id === list.id)}
              onAdd={(t) => addItem(list.id, t)}
              onToggle={toggle}
              onDelItem={delItem}
              onClear={() => clearChecked(list.id)}
              onDelList={() => delList(list)}
            />
          ))}
        </div>
      )}
      {confirmUI}

      {addOpen && (
        <AddListDialog
          onClose={() => setAddOpen(false)}
          onAdd={(name, emoji) =>
            create(
              "lists",
              {
                data: {
                  name,
                  emoji,
                  sales_id: salesId,
                  position: allLists.length,
                },
              },
              {
                onSuccess: () => setAddOpen(false),
                onError: () => notify("Could not add list", { type: "error" }),
              },
            )
          }
        />
      )}
    </div>
  );
};

ListsPage.path = "/lists";

const ListCard = ({
  list,
  items,
  onAdd,
  onToggle,
  onDelItem,
  onClear,
  onDelList,
}: {
  list: List;
  items: ListItem[];
  onAdd: (text: string) => void;
  onToggle: (item: ListItem) => void;
  onDelItem: (item: ListItem) => void;
  onClear: () => void;
  onDelList: () => void;
}) => {
  const [text, setText] = useState("");
  const remaining = items.filter((i) => !i.checked).length;
  const add = () => {
    if (text.trim()) {
      onAdd(text.trim());
      setText("");
    }
  };
  return (
    <Card
      className="p-4 flex flex-col gap-3 border-t-4"
      style={{ borderTopColor: list.color ?? "var(--primary)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{list.emoji}</span>
        <span className="flex-1 truncate text-[13px] font-semibold">
          {list.name}
        </span>
        <span className="text-xs text-muted-foreground">{remaining} left</span>
        <button
          onClick={onDelList}
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Delete list"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {items.length > 0 && (
        <div className="divide-y divide-border overflow-hidden rounded-md border">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 px-2.5 py-2 transition-colors hover:bg-accent/50"
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => onToggle(item)}
              />
              <span
                className={cn(
                  "flex-1 text-[13px]",
                  item.checked && "text-muted-foreground line-through",
                )}
              >
                {item.text}
              </span>
              <button
                onClick={() => onDelItem(item)}
                className="text-muted-foreground opacity-60 transition-colors hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add item…"
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

      {items.some((i) => i.checked) && (
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 self-start"
        >
          <Eraser className="size-3" /> Clear checked
        </button>
      )}
    </Card>
  );
};

const AddListDialog = ({
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
          <DialogTitle>New list</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            className="w-16"
            placeholder="🛒"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <Input
            autoFocus
            placeholder="List name"
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
