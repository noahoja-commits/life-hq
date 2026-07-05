import { useEffect, useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useRedirect,
  useCreate,
  useUpdate,
  useNotify,
} from "ra-core";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  CheckSquare,
  Briefcase,
  Users,
  FolderKanban,
  Rocket,
  LayoutGrid,
  Plus,
  Inbox,
  Sparkles,
  Loader2,
  Timer,
  Wallet,
  CalendarCheck,
} from "lucide-react";
import { applyNavPrefs, navPrefsStore } from "../layout/navPrefsStore";
import { parseNaturalTask } from "../misc/parseNaturalTask";
import { nextInstancePayload } from "../misc/recurrence";
import { getSupabaseClient } from "../providers/supabase/supabase";

const localTodayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Single source of truth: layout/navConfig.ts, in the user's custom order
// (hidden sections stay searchable here on purpose).
const NAV = () => applyNavPrefs(navPrefsStore.get(), { includeHidden: true });

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search or jump to anything…"
      />
      <CommandList>
        <CommandEmpty>Type to search, or press Enter to capture it.</CommandEmpty>
        {open && <PaletteBody query={query} close={close} />}
      </CommandList>
    </CommandDialog>
  );
};

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
}
interface Named {
  id: number;
  name: string;
}
interface Todo {
  id: number;
  text: string;
  done: boolean;
  due_date?: string | null;
  notes?: string | null;
  priority: number;
  position?: number;
  remind_at?: string | null;
  recur_freq?: "daily" | "weekly" | "monthly" | null;
  recur_byweekday?: number[] | null;
  recur_day_of_month?: number | null;
  recur_until?: string | null;
  project_id?: number | null;
  venture_id?: number | null;
  application_id?: number | null;
}
interface HubItem {
  id: number;
  title: string;
  url: string;
  kind: string;
}

interface AiAction {
  kind: string;
  text?: string;
  due_date?: string;
  priority?: number;
  to?: string;
  target_id?: number;
  value?: number;
}

const PaletteBody = ({ query, close }: { query: string; close: () => void }) => {
  const redirect = useRedirect();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [pending, setPending] = useState<AiAction | null>(null);
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data: people } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "last_name", order: "ASC" },
  });
  const { data: projects } = useGetList<Named>("deals", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "updated_at", order: "DESC" },
  });
  const { data: ventures } = useGetList<Named>("ventures", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: todos } = useGetList<Todo>("todos", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "DESC" },
  });
  const { data: hub } = useGetList<HubItem>("hub_items", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: applications } = useGetList<{ id: number; company: string; role?: string }>(
    "applications",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "position", order: "ASC" },
    },
  );
  const { data: trackers } = useGetList<{ id: number; name: string; kind: string; active?: boolean }>(
    "trackers",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "position", order: "ASC" },
    },
  );
  const { data: things } = useGetList<{ id: number; item: string; location: string }>(
    "things",
    {
      pagination: { page: 1, perPage: 300 },
      sort: { field: "item", order: "ASC" },
    },
  );

  const go = (to: string) => {
    redirect(to);
    close();
  };

  const q = query.trim();
  const parsed = parseNaturalTask(q);
  const dueChip =
    parsed.due_date &&
    new Date(parsed.due_date + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  const captureTodo = () =>
    create(
      "todos",
      {
        data: {
          text: parsed.text,
          due_date: parsed.due_date,
          priority: parsed.priority,
          sales_id: salesId,
          position: 0,
        },
      },
      {
        onSuccess: () => {
          notify("Added to To-Dos", { type: "info" });
          close();
        },
      },
    );
  const captureSomeday = () =>
    create(
      "deals",
      { data: { name: q, stage: "someday", sales_id: salesId } },
      {
        onSuccess: () => {
          notify("Captured to Someday", { type: "info" });
          close();
        },
      },
    );

  const askAI = async () => {
    setAiBusy(true);
    setAiAnswer(null);
    try {
      // Compact snapshot of the user's own data (already loaded under RLS)
      // so the AI can answer questions with real numbers, not deflections.
      const today = localTodayISO();
      const openTodos = (todos ?? []).filter((t) => !t.done);
      const snapshot = {
        today,
        open_todos: openTodos.length,
        overdue_todos: openTodos
          .filter((t) => t.due_date && t.due_date < today)
          .slice(0, 15)
          .map((t) => t.text),
        due_today: openTodos
          .filter((t) => t.due_date === today)
          .slice(0, 15)
          .map((t) => t.text),
        projects: (projects ?? []).slice(0, 25).map((p) => p.name),
        ventures: (ventures ?? []).map((v) => v.name),
        job_applications: (applications ?? [])
          .slice(0, 25)
          .map((a) => `${a.company}${a.role ? ` (${a.role})` : ""}`),
        // ids so the AI can ACT on existing items (confirmed client-side)
        open_todo_items: openTodos.slice(0, 30).map((t) => ({ id: t.id, text: t.text })),
        trackers: (trackers ?? [])
          .filter((t) => t.active !== false)
          .slice(0, 20)
          .map((t) => ({ id: t.id, name: t.name, kind: t.kind })),
      };
      const { data, error } = await getSupabaseClient().functions.invoke(
        "ai_command",
        { body: { query: q, today, snapshot } },
      );
      if (error) throw new Error(error.message);
      const a = data?.action as
        | { kind: string; text?: string; due_date?: string; priority?: number; to?: string }
        | undefined;
      if (!a) throw new Error("No action");
      if (a.kind === "create_todo") {
        // Belt-and-braces: if the model dropped the date, the deterministic
        // local parser resolves it from the original query ("friday" etc.).
        const fallbackDue = a.due_date ? null : parseNaturalTask(q).due_date;
        create(
          "todos",
          {
            data: {
              text: a.text || q,
              due_date: a.due_date || fallbackDue || null,
              priority: a.priority || 1,
              sales_id: salesId,
              position: 0,
            },
          },
          { onSuccess: () => { notify(`Added to-do: ${a.text || q}`, { type: "info" }); close(); } },
        );
      } else if (a.kind === "create_project") {
        create(
          "deals",
          { data: { name: a.text || q, stage: "someday", sales_id: salesId } },
          { onSuccess: () => { notify(`Captured: ${a.text || q}`, { type: "info" }); close(); } },
        );
      } else if (a.kind === "navigate" && a.to) {
        redirect(a.to);
        close();
      } else if (a.kind === "start_focus") {
        redirect(`/focus?label=${encodeURIComponent(a.text || q)}`);
        close();
      } else if (a.kind === "reschedule_today" && !a.due_date) {
        setAiAnswer('When should I move them to? Try "push everything to friday".');
      } else if (
        a.kind === "complete_todo" ||
        a.kind === "log_tracker" ||
        a.kind === "reschedule_today"
      ) {
        // Mutating actions on EXISTING data get a confirm step.
        setPending(a as AiAction);
      } else {
        setAiAnswer(a.text || "Done.");
      }
    } catch {
      notify("AI couldn't handle that — try rephrasing.", { type: "error" });
    } finally {
      setAiBusy(false);
    }
  };

  const localToday = localTodayISO();
  const pendingLabel = (a: AiAction): string => {
    if (a.kind === "complete_todo") return `Mark done: "${a.text}"`;
    if (a.kind === "log_tracker") return `Log ${a.value || 1} on ${a.text}`;
    if (a.kind === "reschedule_today") {
      const n = (todos ?? []).filter((t) => !t.done && t.due_date && t.due_date <= localToday).length;
      return `Move ${n} item${n === 1 ? "" : "s"} due today/overdue → ${a.due_date}`;
    }
    return a.text ?? "";
  };

  const executePending = () => {
    const a = pending;
    if (!a) return;
    setPending(null);
    if (a.kind === "complete_todo") {
      const t = (todos ?? []).find((x) => x.id === a.target_id);
      if (!t) {
        notify("Couldn't find that to-do — it may have changed.", { type: "warning" });
        return;
      }
      update(
        "todos",
        { id: t.id, data: { done: true, done_at: new Date().toISOString() }, previousData: t },
        { mutationMode: "optimistic" },
      );
      const nextInstance = nextInstancePayload(t, salesId, todos ?? []);
      if (nextInstance) create("todos", { data: nextInstance });
      notify(`Done: ${t.text} ✓`, { type: "info" });
      close();
    } else if (a.kind === "log_tracker") {
      create(
        "log_entries",
        {
          data: {
            tracker_id: a.target_id,
            value: a.value || 1,
            logged_at: new Date().toISOString(),
            sales_id: salesId,
          },
        },
        {
          onSuccess: () => {
            notify(`Logged ${a.value || 1} on ${a.text} ✓`, { type: "info" });
            close();
          },
          onError: () => notify("Could not log that", { type: "error" }),
        },
      );
    } else if (a.kind === "reschedule_today" && a.due_date) {
      const due = (todos ?? []).filter((t) => !t.done && t.due_date && t.due_date <= localToday);
      due.forEach((t) =>
        update(
          "todos",
          { id: t.id, data: { due_date: a.due_date }, previousData: t },
          { mutationMode: "optimistic" },
        ),
      );
      notify(`Moved ${due.length} item${due.length === 1 ? "" : "s"} to ${a.due_date}`, { type: "info" });
      close();
    }
  };

  return (
    <>
      {pending && (
        <div className="mx-2 my-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm">
          <div className="flex gap-2 mb-2">
            <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
            <span className="font-medium">{pendingLabel(pending)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={executePending}
              className="rounded-md bg-primary text-primary-foreground px-3 py-1 text-xs font-medium"
            >
              Confirm
            </button>
            <button
              onClick={() => setPending(null)}
              className="rounded-md border px-3 py-1 text-xs text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {aiAnswer && (
        <div className="mx-2 my-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm flex gap-2">
          <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
          <span>{aiAnswer}</span>
        </div>
      )}
      {q.length > 0 && (
        <CommandGroup heading="Capture">
          <CommandItem value={`ask ai ${q}`} onSelect={askAI}>
            {aiBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4 text-primary" />
            )}
            <span>
              {aiBusy ? (
                "Thinking…"
              ) : (
                <>
                  Ask AI: <span className="font-medium">{q}</span>
                </>
              )}
            </span>
          </CommandItem>
          <CommandItem value={`add todo ${q}`} onSelect={captureTodo}>
            <Plus className="size-4" />
            <span>
              Add to-do: <span className="font-medium">{parsed.text}</span>
              {dueChip && (
                <span className="ml-2 text-xs rounded-md bg-primary/15 text-primary px-1.5 py-0.5">
                  {dueChip}
                </span>
              )}
              {parsed.priority === 2 && (
                <span className="ml-1 text-xs text-destructive">!</span>
              )}
            </span>
          </CommandItem>
          <CommandItem value={`capture someday ${q}`} onSelect={captureSomeday}>
            <Inbox className="size-4" />
            <span>
              Capture to Someday: <span className="font-medium">{q}</span>
            </span>
          </CommandItem>
        </CommandGroup>
      )}

      <CommandGroup heading="Actions">
        <CommandItem
          value="action quick capture jot"
          onSelect={() => {
            close();
            window.dispatchEvent(new Event("open-quick-capture"));
          }}
        >
          <Plus className="size-4" />
          Quick capture
        </CommandItem>
        <CommandItem value="action start focus session timer" onSelect={() => go("/focus")}>
          <Timer className="size-4" />
          Start a focus session
        </CommandItem>
        <CommandItem value="action new person contact" onSelect={() => go("/contacts/create")}>
          <Users className="size-4" />
          New person
        </CommandItem>
        <CommandItem value="action add transaction expense income" onSelect={() => go("/money")}>
          <Wallet className="size-4" />
          Add a transaction
        </CommandItem>
        <CommandItem value="action weekly review check in" onSelect={() => go("/review")}>
          <CalendarCheck className="size-4" />
          Weekly review
        </CommandItem>
      </CommandGroup>

      <CommandGroup heading="Go to">
        {NAV().map((n) => (
          <CommandItem key={n.to} value={`go ${n.label}`} onSelect={() => go(n.to)}>
            <n.icon className="size-4" />
            {n.label}
            {n.shortcut && (
              <kbd className="ml-auto rounded border bg-muted px-1 font-sans text-[0.65rem] text-muted-foreground">
                g {n.shortcut}
              </kbd>
            )}
          </CommandItem>
        ))}
      </CommandGroup>

      {people && people.length > 0 && (
        <CommandGroup heading="People">
          {people.map((p) => (
            <CommandItem
              key={p.id}
              value={`person ${p.first_name ?? ""} ${p.last_name ?? ""}`}
              onSelect={() => go(`/contacts/${p.id}/show`)}
            >
              <Users className="size-4" />
              {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed"}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {projects && projects.length > 0 && (
        <CommandGroup heading="Projects">
          {projects.map((p) => (
            <CommandItem
              key={p.id}
              value={`project ${p.name}`}
              onSelect={() => go(`/deals/${p.id}/show`)}
            >
              <FolderKanban className="size-4" />
              {p.name}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {todos && todos.filter((t) => !t.done).length > 0 && (
        <CommandGroup heading="To-Dos">
          {todos
            .filter((t) => !t.done)
            .map((t) => (
              <CommandItem key={t.id} value={`todo ${t.text}`} onSelect={() => go("/todos")}>
                <CheckSquare className="size-4" />
                {t.text}
              </CommandItem>
            ))}
        </CommandGroup>
      )}

      {applications && applications.length > 0 && (
        <CommandGroup heading="Jobs">
          {applications.map((a) => (
            <CommandItem
              key={a.id}
              value={`job ${a.company} ${a.role ?? ""}`}
              onSelect={() => go("/applications")}
            >
              <Briefcase className="size-4" />
              {a.company}
              {a.role ? ` · ${a.role}` : ""}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {ventures && ventures.length > 0 && (
        <CommandGroup heading="Ventures">
          {ventures.map((v) => (
            <CommandItem key={v.id} value={`venture ${v.name}`} onSelect={() => go("/ventures")}>
              <Rocket className="size-4" />
              {v.name}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {things && things.length > 0 && (
        <CommandGroup heading="Where is it?">
          {things.map((t) => (
            <CommandItem
              key={`thing-${t.id}`}
              value={`where is ${t.item}`}
              onSelect={() => {
                notify(`${t.item} → ${t.location}`, { type: "info", autoHideDuration: 6000 });
              }}
            >
              <Inbox className="size-4" />
              <span>
                {t.item} <span className="text-muted-foreground">→ {t.location}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {hub && hub.length > 0 && (
        <CommandGroup heading="Hub">
          {hub.map((h) => (
            <CommandItem
              key={h.id}
              value={`hub ${h.title}`}
              onSelect={() => {
                if (h.kind === "embed") go("/hub");
                else window.open(h.url, "_blank", "noopener,noreferrer");
                close();
              }}
            >
              <LayoutGrid className="size-4" />
              {h.title}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </>
  );
};
