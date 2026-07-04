import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import { ListChecks, Plus, Trash2, X, Eraser } from "lucide-react";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "../misc/useConfirm";
import { useHaptics } from "@/hooks/useHaptics";
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
  const [addOpen, setAddOpen] = useState(false);
  const { confirm, confirmUI } = useConfirm();
  const haptic = useHaptics();

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
      { data: { list_id: listId, sales_id: salesId, text, position: allItems.length } },
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
    remove("list_items", { id: item.id, previousData: item }, { mutationMode: "optimistic" });

  const clearChecked = (listId: number) => {
    const checked = allItems.filter((i) => i.list_id === listId && i.checked);
    checked.forEach((i) =>
      remove("list_items", { id: i.id, previousData: i }, { mutationMode: "optimistic" }),
    );
    if (checked.length) notify("Cleared checked", { type: "info" });
  };

  const delList = (list: List) =>
    remove("lists", { id: list.id, previousData: list }, { mutationMode: "optimistic" });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ListChecks className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Lists</h1>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> New list
        </Button>
      </div>

      {listsLoading && allLists.length === 0 ? (
        <CardsSkeleton count={3} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" />
      ) : allLists.length === 0 ? (
        <p className="text-muted-foreground">
          No lists yet. Make a grocery list, a to-buy list, anything.
        </p>
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
              onDelList={() =>
                confirm(`Delete "${list.name}" and all its items?`, () =>
                  delList(list),
                )
              }
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
              { data: { name, emoji, sales_id: salesId, position: allLists.length } },
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
        <span className="font-semibold flex-1 truncate">{list.name}</span>
        <span className="text-xs text-muted-foreground">{remaining} left</span>
        <button
          onClick={onDelList}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete list"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="group flex items-center gap-2">
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => onToggle(item)}
            />
            <span
              className={`text-sm flex-1 ${
                item.checked ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => onDelItem(item)}
              className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              aria-label="Remove"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add item…"
          className="h-9"
        />
        <Button size="icon" variant="secondary" className="h-9 w-9" onClick={add}>
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
          <Input className="w-16" placeholder="🛒" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          <Input autoFocus placeholder="List name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && onAdd(name.trim(), emoji)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => name.trim() && onAdd(name.trim(), emoji)}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
