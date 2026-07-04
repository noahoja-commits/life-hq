import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import {
  CheckSquare,
  Plus,
  Trash2,
  Flag,
  Calendar,
  ChevronDown,
  StickyNote,
  Bell,
  Repeat,
  FolderKanban,
} from "lucide-react";
import { useRedirect } from "ra-core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { parseNaturalTask } from "../misc/parseNaturalTask";
import { useHaptics } from "@/hooks/useHaptics";
import { WaitingOnSection } from "./WaitingOn";
import { Shredder } from "./Shredder";
import {
  nextOccurrenceFields,
  recurLabel,
  type RecurFreq,
} from "../misc/recurrence";

interface Todo {
  id: number;
  text: string;
  due_date?: string | null;
  priority: number;
  done: boolean;
  position: number;
  notes?: string | null;
  remind_at?: string | null;
  recur_freq?: RecurFreq | null;
  recur_byweekday?: number[] | null;
  recur_day_of_month?: number | null;
  recur_until?: string | null;
  project_id?: number | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
// datetime-local <-> ISO(UTC) helpers (keep the user's LOCAL wall-clock time).
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : null);
const prettyTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};
const prettyDate = (iso: string) => {
  const today = localToday();
  if (iso === today) return "Today";
  if (iso === addDays(1)) return "Tomorrow";
  if (iso === addDays(-1)) return "Yesterday";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export const TodosPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const haptic = useHaptics();

  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [high, setHigh] = useState(false);

  const { data } = useGetList<Todo>("todos", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "created_at", order: "DESC" },
  });
  const { data: projectsData } = useGetList<{ id: number; name: string; stage: string }>(
    "deals",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "updated_at", order: "DESC" },
    },
  );
  const projects = (projectsData ?? []).filter((p) => p.stage !== "done");
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const salesId = identity?.id ? Number(identity.id) : null;
  const todos = data ?? [];
  const today = localToday();

  const add = () => {
    if (!text.trim()) return;
    // Natural-language parse: "call dentist friday !" -> due Fri, high priority.
    const parsed = parseNaturalTask(text.trim());
    haptic("tick");
    create(
      "todos",
      {
        data: {
          text: parsed.text,
          due_date: due || parsed.due_date || null,
          priority: high ? 2 : parsed.priority,
          sales_id: salesId,
          position: todos.length,
        },
      },
      {
        // Creates stay pessimistic: optimistic creates need a client id and
        // ids here are DB-generated ("missing id" error).
        onSuccess: () => {
          setText("");
          setDue("");
          setHigh(false);
        },
        onError: () => notify("Could not add to-do", { type: "error" }),
      },
    );
  };

  const toggle = (t: Todo) => {
    const markingDone = !t.done;
    haptic(markingDone ? "success" : "tick");
    update(
      "todos",
      {
        id: t.id,
        data: { done: markingDone, done_at: markingDone ? new Date().toISOString() : null },
        previousData: t,
      },
      { mutationMode: "optimistic" },
    );
    // Recurring? Materialize the next occurrence on completion (GTD-style).
    // Guard: if an open sibling of this series already exists (e.g. the user
    // un-checked and re-checked), don't create a second one.
    const hasOpenSibling = todos.some(
      (o) => !o.done && o.id !== t.id && o.text === t.text && o.recur_freq === t.recur_freq,
    );
    if (markingDone && t.recur_freq && !hasOpenSibling) {
      const next = nextOccurrenceFields(t);
      if (next) {
        create(
          "todos",
          {
            data: {
              text: t.text,
              notes: t.notes ?? null,
              priority: t.priority,
              due_date: next.due_date,
              remind_at: next.remind_at,
              recur_freq: t.recur_freq,
              recur_byweekday: t.recur_byweekday ?? null,
              recur_day_of_month: t.recur_day_of_month ?? null,
              recur_until: t.recur_until ?? null,
              project_id: t.project_id ?? null,
              sales_id: salesId,
              position: t.position,
            },
          },
          {
            onSuccess: () =>
              notify(`↻ Next: ${prettyDate(next.due_date)}`, { type: "info" }),
          },
        );
      }
    }
  };

  const del = (t: Todo) =>
    remove("todos", { id: t.id, previousData: t }, { mutationMode: "optimistic" });

  const patch = (t: Todo, data: Partial<Todo>) =>
    update(
      "todos",
      { id: t.id, data, previousData: t },
      { mutationMode: "optimistic" },
    );

  const open = todos.filter((t) => !t.done);
  const overdue = open.filter((t) => t.due_date && t.due_date < today);
  const dueToday = open.filter((t) => t.due_date === today);
  const upcoming = open.filter((t) => t.due_date && t.due_date > today);
  const anytime = open.filter((t) => !t.due_date);
  const done = todos.filter((t) => t.done);

  const byPriorityThenDate = (a: Todo, b: Todo) =>
    b.priority - a.priority || (a.due_date || "9999").localeCompare(b.due_date || "9999");

  const groups: { key: string; label: string; items: Todo[]; tone?: string }[] = [
    { key: "overdue", label: "Overdue", items: [...overdue].sort(byPriorityThenDate), tone: "text-red-500" },
    { key: "today", label: "Today", items: [...dueToday].sort(byPriorityThenDate), tone: "text-primary" },
    { key: "upcoming", label: "Upcoming", items: [...upcoming].sort(byPriorityThenDate) },
    { key: "anytime", label: "Anytime", items: [...anytime].sort(byPriorityThenDate) },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckSquare className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">To-Dos</h1>
      </div>

      {/* Quick add */}
      <Card className="p-3 mb-6 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a to-do…"
          className="flex-1 border-0 shadow-none focus-visible:ring-0"
          autoFocus
        />
        <div className="flex gap-1.5 items-center">
          <div className="flex gap-1">
            {[
              { label: "Today", v: today },
              { label: "Tmrw", v: addDays(1) },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => setDue(due === q.v ? "" : q.v)}
                className={cn(
                  "text-xs rounded-full px-2.5 py-1 border transition-colors",
                  due === q.v ? "bg-primary/15 text-primary border-primary/30" : "hover:bg-accent",
                )}
              >
                {q.label}
              </button>
            ))}
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="text-xs rounded-full px-2 py-1 border bg-transparent"
              aria-label="Due date"
            />
          </div>
          <button
            onClick={() => setHigh((h) => !h)}
            aria-label="High priority"
            className={cn(
              "rounded-full p-1.5 border transition-colors",
              high ? "bg-red-500/15 text-red-500 border-red-500/30" : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Flag className="size-4" />
          </button>
          <Button onClick={add} size="icon" className="rounded-full shrink-0">
            <Plus className="size-4" />
          </Button>
        </div>
      </Card>

      {open.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          Nothing on your plate. Add a to-do above — or enjoy the clear deck. ✨
        </Card>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.key} className="mb-6">
              <h2 className={cn("text-xs font-semibold uppercase tracking-wide mb-2", g.tone || "text-muted-foreground")}>
                {g.label} · {g.items.length}
              </h2>
              <Card className="divide-y p-0">
                {g.items.map((t) => (
                  <TodoRow
                    key={t.id}
                    t={t}
                    projects={projects}
                    projectName={projectName}
                    onToggle={() => toggle(t)}
                    onDelete={() => del(t)}
                    onPatch={(data) => patch(t, data)}
                  />
                ))}
              </Card>
            </section>
          ))
      )}

      <WaitingOnSection />

      {done.length > 0 && (
        <section className="mb-6 opacity-70">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-2 text-muted-foreground">
            Done · {done.length}
          </h2>
          <Card className="divide-y p-0">
            {done.slice(0, 30).map((t) => (
              <TodoRow
                key={t.id}
                t={t}
                projects={projects}
                projectName={projectName}
                onToggle={() => toggle(t)}
                onDelete={() => del(t)}
                onPatch={(data) => patch(t, data)}
              />
            ))}
          </Card>
        </section>
      )}
    </div>
  );
};

TodosPage.path = "/todos";

const TodoRow = ({
  t,
  projects,
  projectName,
  onToggle,
  onDelete,
  onPatch,
}: {
  t: Todo;
  projects: { id: number; name: string }[];
  projectName: Map<number, string>;
  onToggle: () => void;
  onDelete: () => void;
  onPatch: (data: Partial<Todo>) => void;
}) => {
  const redirect = useRedirect();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(t.notes ?? "");
  const hasNote = !!(t.notes && t.notes.trim());
  const repeat = recurLabel(t);
  const linkedProject = t.project_id ? projectName.get(t.project_id) : null;

  const saveNote = () => {
    const next = note.trim();
    if (next !== (t.notes ?? "").trim()) onPatch({ notes: next || null });
  };

  return (
    <div className="group">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Checkbox
          checked={t.done}
          onCheckedChange={onToggle}
          aria-label={`Mark ${t.text} done`}
          className="transition-transform active:scale-90"
        />
        {t.priority === 2 && !t.done && <Flag className="size-3.5 text-red-500 shrink-0" />}
        <button
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "flex-1 text-left text-sm truncate",
            t.done && "line-through text-muted-foreground",
          )}
        >
          {t.text}
          {hasNote && !expanded && (
            <StickyNote className="inline size-3 ml-1.5 text-muted-foreground align-[-1px]" />
          )}
          {repeat && !expanded && (
            <Repeat className="inline size-3 ml-1.5 text-muted-foreground align-[-1px]" />
          )}
        </button>
        {linkedProject && !t.done && (
          <button
            onClick={() => redirect(`/deals/${t.project_id}/show`)}
            className="hidden sm:flex text-xs text-muted-foreground hover:text-primary items-center gap-1 shrink-0 max-w-28"
          >
            <FolderKanban className="size-3 shrink-0" />
            <span className="truncate">{linkedProject}</span>
          </button>
        )}
        {t.remind_at && !t.done && (
          <span className="text-xs text-primary flex items-center gap-1 shrink-0">
            <Bell className="size-3" />
            {prettyTime(t.remind_at)}
          </span>
        )}
        {t.due_date && !t.done && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Calendar className="size-3" />
            {prettyDate(t.due_date)}
          </span>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? "Collapse" : "Expand details"}
        >
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
        <button
          onClick={onDelete}
          className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          aria-label="Delete to-do"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 pl-11 space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="Add notes, links, context…"
            className="min-h-16 text-sm resize-y"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="text-muted-foreground">Due</label>
            <input
              type="date"
              value={t.due_date ?? ""}
              onChange={(e) => onPatch({ due_date: e.target.value || null })}
              className="rounded-md border px-2 py-1 bg-transparent"
            />
            <button
              onClick={() => onPatch({ priority: t.priority === 2 ? 1 : 2 })}
              className={cn(
                "rounded-full px-2 py-1 border transition-colors",
                t.priority === 2
                  ? "bg-red-500/15 text-red-500 border-red-500/30"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {t.priority === 2 ? "High priority" : "Set high priority"}
            </button>
          </div>

          {/* Reminder time */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="text-muted-foreground flex items-center gap-1">
              <Bell className="size-3" /> Remind
            </label>
            <input
              type="datetime-local"
              value={toLocalInput(t.remind_at)}
              onChange={(e) => onPatch({ remind_at: fromLocalInput(e.target.value) })}
              className="rounded-md border px-2 py-1 bg-transparent"
            />
            {t.remind_at && (
              <button
                onClick={() => onPatch({ remind_at: null })}
                className="text-muted-foreground hover:text-destructive underline"
              >
                clear
              </button>
            )}
          </div>

          {/* Recurrence */}
          <RecurControl t={t} onPatch={onPatch} />

          {/* AI shredder for overwhelming tasks */}
          {!t.done && <Shredder todo={t} />}

          {/* Project link */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-muted-foreground flex items-center gap-1">
                <FolderKanban className="size-3" /> Project
              </label>
              <Select
                value={t.project_id ? String(t.project_id) : "none"}
                onValueChange={(v) =>
                  onPatch({ project_id: v === "none" ? null : Number(v) })
                }
              >
                <SelectTrigger className="h-7 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const RecurControl = ({
  t,
  onPatch,
}: {
  t: Todo;
  onPatch: (data: Partial<Todo>) => void;
}) => {
  const freq = t.recur_freq ?? null;
  const setFreq = (f: RecurFreq | null) => {
    if (!f) {
      onPatch({ recur_freq: null, recur_byweekday: null, recur_day_of_month: null });
      return;
    }
    const patch: Partial<Todo> = { recur_freq: f };
    if (f === "weekly" && (!t.recur_byweekday || t.recur_byweekday.length === 0)) {
      patch.recur_byweekday = [new Date((t.due_date ?? "") + "T00:00:00").getDay() || new Date().getDay()];
    }
    if (f === "monthly" && !t.recur_day_of_month) {
      patch.recur_day_of_month = t.due_date ? new Date(t.due_date + "T00:00:00").getDate() : new Date().getDate();
    }
    onPatch(patch);
  };
  const toggleDay = (d: number) => {
    const cur = new Set(t.recur_byweekday ?? []);
    if (cur.has(d)) cur.delete(d);
    else cur.add(d);
    onPatch({ recur_byweekday: Array.from(cur).sort((a, b) => a - b) });
  };

  const OPTIONS: { label: string; value: RecurFreq | null }[] = [
    { label: "Once", value: null },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
  ];

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-muted-foreground flex items-center gap-1">
          <Repeat className="size-3" /> Repeat
        </label>
        <div className="flex gap-1">
          {OPTIONS.map((o) => (
            <button
              key={o.label}
              onClick={() => setFreq(o.value)}
              className={cn(
                "rounded-full px-2.5 py-1 border transition-colors",
                freq === o.value
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "hover:bg-accent",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {freq === "weekly" && (
        <div className="flex gap-1 pl-1">
          {WEEKDAYS.map((w, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={cn(
                "size-7 rounded-full border text-[11px] transition-colors",
                (t.recur_byweekday ?? []).includes(i)
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "hover:bg-accent",
              )}
              aria-label={`weekday ${i}`}
            >
              {w}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
