import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
} from "ra-core";
import { Package, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Thing {
  id: number;
  item: string;
  location: string;
}

/**
 * "Where did I put it?" — a tiny item -> location registry. Searchable from
 * the command palette, which is where it really earns its keep.
 */
export const WhereIsItSection = () => {
  const { identity } = useGetIdentity();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const [item, setItem] = useState("");
  const [location, setLocation] = useState("");
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data } = useGetList<Thing>("things", {
    pagination: { page: 1, perPage: 300 },
    sort: { field: "item", order: "ASC" },
  });
  const things = data ?? [];

  const add = () => {
    if (!item.trim() || !location.trim()) return;
    create("things", {
      data: { item: item.trim(), location: location.trim(), sales_id: salesId },
    });
    setItem("");
    setLocation("");
  };

  return (
    <section className="mt-8">
      <h2 className="u-label mb-1 flex items-center gap-1.5 text-muted-foreground">
        <Package className="size-3.5" /> Where is it?
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Passport, spare key, that one cable — log where things live, find them
        later by typing the item into ⌘K search.
      </p>
      <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
        {things.map((t) => (
          <div
            key={t.id}
            className="group flex items-center gap-3 px-4 py-2.5 text-[13px]"
          >
            <span className="w-36 shrink-0 truncate font-medium">{t.item}</span>
            <input
              defaultValue={t.location}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== t.location)
                  update(
                    "things",
                    {
                      id: t.id,
                      data: {
                        location: v,
                        updated_at: new Date().toISOString(),
                      },
                      previousData: t,
                    },
                    { mutationMode: "optimistic" },
                  );
              }}
              className="flex-1 bg-transparent text-muted-foreground outline-none focus:text-foreground"
              aria-label={`Location of ${t.item}`}
            />
            <button
              onClick={() =>
                remove(
                  "things",
                  { id: t.id, previousData: t },
                  { mutationMode: "optimistic" },
                )
              }
              className="text-muted-foreground opacity-60 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
              aria-label={`Delete ${t.item}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 p-3">
          <Input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Item (passport, AA batteries…)"
            className="h-8 w-48 text-[13px]"
          />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Where it lives"
            className="h-8 min-w-36 flex-1 text-[13px]"
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            onClick={add}
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
      </div>
    </section>
  );
};
