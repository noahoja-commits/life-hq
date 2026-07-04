import { useEffect, useRef, useState } from "react";
import { useGetList, useGetIdentity, useCreate, useNotify } from "ra-core";
import { Sparkles, Send, Loader2, ScrollText, Eraser } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "../providers/supabase/supabase";
import { SCRIPT_CATEGORIES } from "../scripts/ScriptsPage";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "Draft a cold-call opener for a job application follow-up",
  "What should I focus on today?",
  "Break down the thing I'm avoiding into tiny steps",
  "Write a short interview answer for 'tell me about yourself'",
];

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const AiPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const salesId = identity?.id ? Number(identity.id) : null;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Light data snapshot so answers are grounded in real life, not generic.
  const { data: todos } = useGetList<{ id: number; text: string; done: boolean; due_date?: string | null }>(
    "todos",
    { pagination: { page: 1, perPage: 100 }, sort: { field: "created_at", order: "DESC" } },
  );
  const { data: apps } = useGetList<{ id: number; company: string; role?: string; status: string }>(
    "applications",
    { pagination: { page: 1, perPage: 50 }, sort: { field: "position", order: "ASC" } },
  );
  const { data: goals } = useGetList<{ id: number; title: string; status: string }>("goals", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "position", order: "ASC" },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const history = [...messages, { role: "user" as const, text: content }];
    setMessages(history);
    setInput("");
    setBusy(true);
    try {
      const today = localToday();
      const open = (todos ?? []).filter((t) => !t.done);
      const snapshot = {
        today,
        open_todos: open.length,
        overdue: open.filter((t) => t.due_date && t.due_date < today).slice(0, 10).map((t) => t.text),
        due_today: open.filter((t) => t.due_date === today).slice(0, 10).map((t) => t.text),
        job_applications: (apps ?? [])
          .filter((a) => a.status !== "closed")
          .slice(0, 15)
          .map((a) => `${a.company}${a.role ? ` (${a.role})` : ""} [${a.status}]`),
        active_goals: (goals ?? []).filter((g) => g.status === "active").map((g) => g.title),
      };
      const { data, error } = await getSupabaseClient().functions.invoke("ai_chat", {
        body: { messages: history, today, snapshot },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setMessages([...history, { role: "assistant", text: String(data?.text ?? "") }]);
    } catch {
      notify("The AI hit a snag — try again in a moment.", { type: "error" });
      setMessages(history.slice(0, -1));
      setInput(content);
    } finally {
      setBusy(false);
    }
  };

  const saveAsScript = (text: string) => {
    create(
      "scripts",
      {
        data: {
          title: text.split("\n")[0].slice(0, 60).replace(/^#+\s*/, "") || "AI script",
          category: SCRIPT_CATEGORIES[0],
          body: text,
          sales_id: salesId,
          position: 0,
        },
      },
      {
        onSuccess: () => notify("Saved to Scripts ✓", { type: "info" }),
        onError: () => notify("Could not save", { type: "error" }),
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ minHeight: "calc(100vh - 8rem)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold flex-1">AI</h1>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Eraser className="size-3.5" /> Clear
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Knows your to-dos, jobs, and goals. Great at drafting scripts — save
        any reply straight to your Scripts section.
      </p>

      {/* Conversation */}
      <div className="flex-1 flex flex-col gap-3 mb-4">
        {messages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-xl border bg-card p-3 text-sm text-left text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-6 whitespace-pre-line",
              m.role === "user"
                ? "self-end bg-primary text-primary-foreground rounded-br-sm"
                : "self-start bg-card border rounded-bl-sm",
            )}
          >
            {m.text}
            {m.role === "assistant" && (
              <div className="mt-2 -mb-0.5">
                <button
                  onClick={() => saveAsScript(m.text)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <ScrollText className="size-3" /> Save as script
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="self-start rounded-2xl border bg-card px-4 py-3">
            <Loader2 className="size-4 animate-spin text-primary" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <Card className="p-2 flex gap-2 items-end sticky bottom-20 md:bottom-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask anything… (Enter to send, Shift+Enter for a new line)"
          className="min-h-11 max-h-40 border-0 shadow-none focus-visible:ring-0 resize-none"
        />
        <Button
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          size="icon"
          className="rounded-full shrink-0 mb-0.5"
          aria-label="Send"
        >
          <Send className="size-4" />
        </Button>
      </Card>
    </div>
  );
};

AiPage.path = "/ai";
