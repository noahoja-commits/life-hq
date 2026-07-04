import { useState } from "react";
import { useGetIdentity, useNotify, useRedirect } from "ra-core";
import { Shapes, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "../providers/supabase/supabase";
import { useHaptics } from "@/hooks/useHaptics";
import { TEMPLATES, TEMPLATE_CATEGORIES, type TemplateDef } from "./templatesData";

/** Seed a template's rows (parents first, children with returned ids). */
async function applyTemplate(t: TemplateDef, salesId: number): Promise<void> {
  const supabase = getSupabaseClient();
  const s = t.seeds;

  for (const r of s.routines ?? []) {
    const { data: routine, error } = await supabase
      .from("routines")
      .insert({ name: r.name, emoji: r.emoji, remind_time: r.remind_time ?? null, sales_id: salesId, position: 999 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { error: e2 } = await supabase.from("routine_steps").insert(
      r.steps.map((text, i) => ({ routine_id: routine.id, text, position: i, sales_id: salesId })),
    );
    if (e2) throw new Error(e2.message);
  }

  for (const l of s.lists ?? []) {
    const { data: list, error } = await supabase
      .from("lists")
      .insert({ name: l.name, emoji: l.emoji, sales_id: salesId, position: 999 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (l.items.length) {
      const { error: e2 } = await supabase.from("list_items").insert(
        l.items.map((text, i) => ({ list_id: list.id, text, position: i, sales_id: salesId })),
      );
      if (e2) throw new Error(e2.message);
    }
  }

  if (s.trackers?.length) {
    const { error } = await supabase.from("trackers").insert(
      s.trackers.map((tr, i) => ({
        name: tr.name, emoji: tr.emoji, kind: tr.kind, unit: tr.unit ?? null,
        target: tr.target ?? null, category: "Life", sales_id: salesId, position: 999 + i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (s.todos?.length) {
    const { error } = await supabase.from("todos").insert(
      s.todos.map((td, i) => ({ text: td.text, priority: td.priority ?? 1, sales_id: salesId, position: i })),
    );
    if (error) throw new Error(error.message);
  }

  if (s.project) {
    const { data: deal, error } = await supabase
      .from("deals")
      .insert({ name: s.project.name, description: s.project.description ?? null, stage: "active", sales_id: salesId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (s.project.todos.length) {
      const { error: e2 } = await supabase.from("todos").insert(
        s.project.todos.map((text, i) => ({ text, project_id: deal.id, sales_id: salesId, position: i })),
      );
      if (e2) throw new Error(e2.message);
    }
  }

  if (s.page) {
    const { error } = await supabase.from("pages").insert({
      title: s.page.title, emoji: s.page.emoji, kind: s.page.kind,
      content: s.page.content, theme: s.page.accent ? { accent: s.page.accent } : {},
      sales_id: salesId, position: 0,
    });
    if (error) throw new Error(error.message);
  }
}

export const TemplatesPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const redirect = useRedirect();
  const haptic = useHaptics();
  const [cat, setCat] = useState<string>("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  const shown = TEMPLATES.filter((t) => cat === "All" || t.category === cat);

  const use = async (t: TemplateDef) => {
    const salesId = identity?.id ? Number(identity.id) : null;
    if (!salesId) return;
    setBusyId(t.id);
    try {
      await applyTemplate(t, salesId);
      haptic("success");
      setUsedIds((s) => new Set(s).add(t.id));
      notify(`${t.emoji} ${t.title} added`, { type: "info" });
      redirect(t.goto);
    } catch (e) {
      notify(`Could not apply template: ${e instanceof Error ? e.message : "error"}`, { type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Shapes className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Templates</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        One tap adds real, editable content — routines, lists, trackers,
        projects, docs, and sheets. Tweak everything after.
      </p>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5">
        {["All", ...TEMPLATE_CATEGORIES].map((c) => (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map((t) => (
          <Card key={t.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{t.emoji}</span>
              <span className="font-semibold flex-1 truncate">{t.title}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.category}</span>
            </div>
            <p className="text-sm text-muted-foreground flex-1">{t.description}</p>
            <Button
              size="sm"
              variant={usedIds.has(t.id) ? "secondary" : "default"}
              disabled={busyId === t.id}
              onClick={() => use(t)}
              className="gap-1.5 self-start"
            >
              {busyId === t.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : usedIds.has(t.id) ? (
                <Check className="size-3.5" />
              ) : null}
              {usedIds.has(t.id) ? "Added — add again" : "Use template"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

TemplatesPage.path = "/templates";
