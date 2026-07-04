import { useState } from "react";
import { useCreate, useGetIdentity, useNotify } from "ra-core";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "../providers/supabase/supabase";
import { useHaptics } from "@/hooks/useHaptics";

/**
 * Task shredder: AI explodes one overwhelming to-do into tiny physical
 * actions, which one tap adds as real to-dos (inheriting date/priority/links).
 */
export const Shredder = ({
  todo,
}: {
  todo: {
    id: number;
    text: string;
    notes?: string | null;
    due_date?: string | null;
    priority: number;
    project_id?: number | null;
  };
}) => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const haptic = useHaptics();
  const [create] = useCreate();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[] | null>(null);
  const salesId = identity?.id ? Number(identity.id) : null;

  const shred = async () => {
    setBusy(true);
    try {
      const { data, error } = await getSupabaseClient().functions.invoke("ai_chat", {
        body: {
          messages: [
            {
              role: "user",
              text: `Break this overwhelming task into 3-7 TINY physical first-actions (each under ~5 minutes, concrete enough that "open laptop" would count). Reply with ONLY the steps, one per line, each starting with "- ". Task: "${todo.text}"${todo.notes ? ` (context: ${todo.notes.slice(0, 300)})` : ""}`,
            },
          ],
        },
      });
      if (error) throw new Error(error.message);
      const lines = String(data?.text ?? "")
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter((l) => l.length > 2 && l.length < 140)
        .slice(0, 7);
      if (lines.length === 0) throw new Error("no steps");
      setSteps(lines);
    } catch {
      notify("Couldn't shred that one — try again.", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const addAll = () => {
    if (!steps) return;
    haptic("success");
    steps.forEach((text, i) =>
      create("todos", {
        data: {
          text,
          due_date: todo.due_date ?? null,
          priority: todo.priority,
          project_id: todo.project_id ?? null,
          notes: `↳ from: ${todo.text}`,
          sales_id: salesId,
          position: i,
        },
      }),
    );
    notify(`Added ${steps.length} tiny steps ✓`, { type: "info" });
    setSteps(null);
  };

  return (
    <div className="flex flex-col gap-2 text-xs">
      {!steps ? (
        <button
          onClick={shred}
          disabled={busy}
          className="flex items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary/10 text-primary px-3 py-1.5 hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {busy ? "Shredding…" : "Break it down (AI)"}
        </button>
      ) : (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex flex-col gap-1.5">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-primary">·</span>
              <span>{s}</span>
            </div>
          ))}
          <div className="flex gap-2 mt-1.5">
            <Button size="sm" className="h-7 text-xs gap-1" onClick={addAll}>
              <Plus className="size-3" /> Add all as to-dos
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSteps(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
