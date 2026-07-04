import { useState } from "react";
import { useGetList, useGetIdentity, useCreate, useUpdate, useDelete } from "ra-core";
import { Package, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        <Package className="size-3.5" /> Where is it?
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Passport, spare key, that one cable — log where things live, find them
        later by typing the item into ⌘K search.
      </p>
      <Card className="p-0 divide-y">
        {things.map((t) => (
          <div key={t.id} className="group flex items-center gap-3 px-4 py-2 text-sm">
            <span className="font-medium w-36 truncate shrink-0">{t.item}</span>
            <input
              defaultValue={t.location}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== t.location)
                  update(
                    "things",
                    { id: t.id, data: { location: v, updated_at: new Date().toISOString() }, previousData: t },
                    { mutationMode: "optimistic" },
                  );
              }}
              className="flex-1 bg-transparent outline-none text-muted-foreground focus:text-foreground"
              aria-label={`Location of ${t.item}`}
            />
            <button
              onClick={() =>
                remove("things", { id: t.id, previousData: t }, { mutationMode: "optimistic" })
              }
              className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${t.item}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 items-center p-3">
          <Input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Item (passport, AA batteries…)"
            className="w-48 h-8 text-sm"
          />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Where it lives"
            className="flex-1 min-w-36 h-8 text-sm"
          />
          <Button size="sm" variant="secondary" className="h-8 gap-1" onClick={add}>
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
      </Card>
    </section>
  );
};
