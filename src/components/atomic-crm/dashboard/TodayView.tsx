import { useMemo, useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useRedirect,
} from "ra-core";
import {
  Sun,
  Sunset,
  Moon,
  Clock,
  Bell,
  Repeat,
  Briefcase,
  CheckCircle2,
  Timer,
  Wallet,
  Users,
  Hourglass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { nextOccurrenceFields, type RecurFreq } from "../misc/recurrence";

interface Todo {
  id: number;
  text: string;
  due_date?: string | null;
  remind_at?: string | null;
  priority: number;
  done: boolean;
  done_at?: string | null;
  position: number;
  notes?: string | null;
  recur_freq?: RecurFreq | null;
  recur_byweekday?: number[] | null;
  recur_day_of_month?: number | null;
  recur_until?: string | null;
  project_id?: number | null;
}
interface Routine {
  id: number;
  name: string;
  emoji?: string;
  active_days?: number[] | null;
}
interface Step {
  id: number;
  routine_id: number;
  text: string;
}
interface Check {
  id: number;
  step_id: number;
  checked_on: string;
}
interface Application {
  id: number;
  company: string;
  role?: string;
  status: string;
  follow_up_date?: string | null;
}
interface FocusSession {
  id: number;
  actual_minutes?: number | null;
  completed: boolean;
  started_at: string;
}
interface WaitingItem {
  id: number;
  text: string;
  who?: string;
  since: string;
  nudge_after_days: number;
  resolved: boolean;
}
interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  touch_cadence_days?: number | null;
  last_touch_on?: string | null;
}
interface Bill {
  id: number;
  name: string;
  amount: number;
  due_day: number;
  category?: string;
  autopay: boolean;
  active: boolean;
  last_paid_on?: string | null;
}

type Band = "morning" | "afternoon" | "evening" | "anytime";
interface AgendaItem {
  key: string;
  kind: "todo" | "routine" | "job" | "bill" | "person" | "waiting";
  label: string;
  meta?: string;
  time?: string | null; // remind_at ISO
  band: Band;
  overdue: boolean;
  priority: number;
  sortT: number; // for ordering
  done: () => void;
  open?: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDaysStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const bandOf = (iso?: string | null): Band => {
  if (!iso) return "anytime";
  const h = new Date(iso).getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};
// Local calendar date of a UTC ISO timestamp (remind_at is stored UTC).
const localDateOf = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const prettyTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const startOfWeek = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};
// Next occurrence of a bill's due day (clamped to month length).
const billNextDue = (dueDay: number): string => {
  const now = new Date();
  const mk = (y: number, m: number) => {
    const last = new Date(y, m + 1, 0).getDate();
    return `${y}-${pad(m + 1)}-${pad(Math.min(dueDay, last))}`;
  };
  const thisMonth = mk(now.getFullYear(), now.getMonth());
  if (thisMonth >= localToday()) return thisMonth;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return mk(next.getFullYear(), next.getMonth());
};

const BAND_META: Record<Band, { label: string; icon: typeof Sun }> = {
  morning: { label: "Morning", icon: Sun },
  afternoon: { label: "Afternoon", icon: Sunset },
  evening: { label: "Evening", icon: Moon },
  anytime: { label: "Anytime today", icon: Clock },
};

export const TodayView = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const haptic = useHaptics();
  const [update] = useUpdate();
  const [create] = useCreate();
  const [view, setView] = useState<"today" | "week">("today");
  const salesId = identity?.id ? Number(identity.id) : null;
  const today = localToday();

  const { data: todos, isPending: todosLoading } = useGetList<Todo>("todos", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "created_at", order: "DESC" },
  });
  const { data: routines } = useGetList<Routine>("routines", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: steps } = useGetList<Step>("routine_steps", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: checks } = useGetList<Check>("routine_checks", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "checked_on", order: "DESC" },
  });
  const { data: apps } = useGetList<Application>("applications", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "follow_up_date", order: "ASC" },
  });
  const { data: focus } = useGetList<FocusSession>("focus_sessions", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "started_at", order: "DESC" },
  });
  const { data: bills } = useGetList<Bill>("bills", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "due_day", order: "ASC" },
  });
  const { data: people } = useGetList<Person>("contacts", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "last_seen", order: "DESC" },
  });
  const { data: waiting } = useGetList<WaitingItem>("waiting_items", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "since", order: "ASC" },
  });

  // ── Completion handlers ───────────────────────────────────────────────────
  const completeTodo = (t: Todo) => {
    haptic("success");
    update(
      "todos",
      {
        id: t.id,
        data: { done: true, done_at: new Date().toISOString() },
        previousData: t,
      },
      { mutationMode: "optimistic" },
    );
    // Guard against a duplicate next-instance if a sibling of the series is open.
    const hasOpenSibling = (todos ?? []).some(
      (o) => !o.done && o.id !== t.id && o.text === t.text && o.recur_freq === t.recur_freq,
    );
    if (t.recur_freq && !hasOpenSibling) {
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
          // NOTE: creates must stay pessimistic — optimistic creates need a
          // client-supplied id, but ids here are DB-generated ("missing id").
        );
      }
    }
  };
  const checkStep = (step: Step) => {
    haptic("success");
    create("routine_checks", {
      data: { step_id: step.id, sales_id: salesId, checked_on: today },
    });
  };
  const clearFollowUp = (a: Application) => {
    haptic("tick");
    update(
      "applications",
      { id: a.id, data: { follow_up_date: null }, previousData: a },
      { mutationMode: "optimistic" },
    );
  };
  const chaseWaiting = (w: WaitingItem) => {
    haptic("tick");
    update(
      "waiting_items",
      { id: w.id, data: { since: today }, previousData: w },
      { mutationMode: "optimistic" },
    );
  };
  const markTouched = (p: Person) => {
    haptic("success");
    update(
      "contacts",
      { id: p.id, data: { last_touch_on: today }, previousData: p },
      { mutationMode: "optimistic" },
    );
  };
  const payBill = (b: Bill) => {
    haptic("success");
    update(
      "bills",
      { id: b.id, data: { last_paid_on: today }, previousData: b },
      { mutationMode: "optimistic" },
    );
    // Log the expense so Money stays honest.
    create(
      "transactions",
      {
        data: {
          amount: Number(b.amount),
          kind: "expense",
          category: b.category || "Bills",
          note: b.name,
          occurred_on: today,
          sales_id: salesId,
        },
      },
      { onError: () => haptic("undo") },
    );
  };

  // ── Build today's agenda ──────────────────────────────────────────────────
  const checkedToday = useMemo(
    () => new Set((checks ?? []).filter((c) => c.checked_on === today).map((c) => c.step_id)),
    [checks, today],
  );

  const agenda = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = [];

    for (const t of todos ?? []) {
      if (t.done) continue;
      const isDue = t.due_date && t.due_date <= today;
      const remindLocal = t.remind_at ? localDateOf(t.remind_at) : null;
      const isRemindToday = remindLocal !== null && remindLocal <= today;
      if (!isDue && !isRemindToday) continue;
      const overdue =
        !!(t.due_date && t.due_date < today) || (remindLocal !== null && remindLocal < today);
      items.push({
        key: `todo-${t.id}`,
        kind: "todo",
        label: t.text,
        meta: overdue ? "Carried over" : t.remind_at ? prettyTime(t.remind_at) : undefined,
        time: t.remind_at,
        band: bandOf(t.remind_at),
        overdue,
        priority: t.priority,
        sortT: t.remind_at ? new Date(t.remind_at).getTime() : 8.64e15,
        done: () => completeTodo(t),
      });
    }

    const dow = new Date().getDay();
    for (const r of routines ?? []) {
      const active = !r.active_days || r.active_days.length === 0 || r.active_days.includes(dow);
      if (!active) continue;
      const rSteps = (steps ?? []).filter((s) => s.routine_id === r.id);
      const remaining = rSteps.filter((s) => !checkedToday.has(s.id));
      for (const s of remaining) {
        items.push({
          key: `step-${s.id}`,
          kind: "routine",
          label: s.text,
          meta: `${r.emoji ?? ""} ${r.name}`.trim(),
          band: "anytime",
          overdue: false,
          priority: 0,
          sortT: 9e15,
          done: () => checkStep(s),
          open: () => redirect("/routines"),
        });
      }
    }

    for (const a of apps ?? []) {
      if (!a.follow_up_date || a.follow_up_date > today) continue;
      if (a.status === "closed" || a.status === "offer") continue;
      items.push({
        key: `job-${a.id}`,
        kind: "job",
        label: `Follow up: ${a.company}`,
        meta: a.role || "Job application",
        band: "anytime",
        overdue: a.follow_up_date < today,
        priority: 1,
        sortT: 9.5e15,
        done: () => clearFollowUp(a),
        open: () => redirect("/applications"),
      });
    }

    for (const b of bills ?? []) {
      if (!b.active || b.autopay) continue;
      if (b.last_paid_on && b.last_paid_on.startsWith(today.slice(0, 7))) continue;
      const due = billNextDue(b.due_day);
      if (due > today) continue; // only due today (or overdue this cycle)
      items.push({
        key: `bill-${b.id}`,
        kind: "bill",
        label: `Pay ${b.name}`,
        meta: `$${Number(b.amount)} · due today`,
        band: "anytime",
        overdue: false,
        priority: 2,
        sortT: 9.2e15,
        done: () => payBill(b),
        open: () => redirect("/money"),
      });
    }

    for (const p of people ?? []) {
      if (!p.touch_cadence_days) continue;
      const daysSince = p.last_touch_on
        ? Math.round(
            (new Date(today + "T00:00:00").getTime() - new Date(p.last_touch_on + "T00:00:00").getTime()) / 86400000,
          )
        : 9999;
      if (daysSince < p.touch_cadence_days) continue;
      const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "someone";
      items.push({
        key: `person-${p.id}`,
        kind: "person",
        label: `Reach out to ${name}`,
        meta: p.last_touch_on ? `last touch ${daysSince}d ago` : "no touch logged yet",
        band: "anytime",
        overdue: false,
        priority: 0,
        sortT: 9.7e15,
        done: () => markTouched(p),
        open: () => redirect(`/contacts/${p.id}/show`),
      });
    }

    for (const w of waiting ?? []) {
      if (w.resolved) continue;
      const days = Math.round(
        (new Date(today + "T00:00:00").getTime() - new Date(w.since + "T00:00:00").getTime()) / 86400000,
      );
      if (days < w.nudge_after_days) continue;
      items.push({
        key: `wait-${w.id}`,
        kind: "waiting",
        label: `Chase: ${w.text}`,
        meta: `${w.who ? `waiting on ${w.who} · ` : ""}${days}d — checking resets the clock`,
        band: "anytime",
        overdue: false,
        priority: 0,
        sortT: 9.8e15,
        done: () => chaseWaiting(w),
        open: () => redirect("/todos"),
      });
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, routines, steps, apps, bills, people, waiting, checkedToday, today, salesId]);

  const sortedAgenda = useMemo(
    () =>
      [...agenda].sort(
        (a, b) =>
          Number(b.overdue) - Number(a.overdue) ||
          a.sortT - b.sortT ||
          b.priority - a.priority,
      ),
    [agenda],
  );

  // "Do this next" — first actionable single thing (prefer a todo/job over routine).
  const nextItem =
    sortedAgenda.find((i) => i.kind !== "routine") ?? sortedAgenda[0] ?? null;

  // Group into bands
  const bands: Band[] = ["morning", "afternoon", "evening", "anytime"];
  const grouped = bands
    .map((b) => ({ band: b, items: sortedAgenda.filter((i) => i.band === b) }))
    .filter((g) => g.items.length > 0);

  // ── This week strip (streak-free) ─────────────────────────────────────────
  const weekStart = startOfWeek().getTime();
  const doneThisWeek = (todos ?? []).filter(
    (t) => t.done && t.done_at && new Date(t.done_at).getTime() >= weekStart,
  ).length;
  const focusMinThisWeek = (focus ?? [])
    .filter((f) => f.completed && new Date(f.started_at).getTime() >= weekStart)
    .reduce((sum, f) => sum + (f.actual_minutes ?? 0), 0);

  // ── Week ahead ────────────────────────────────────────────────────────────
  const weekAhead = useMemo(() => {
    const days: { date: string; label: string; items: { key: string; label: string; meta?: string }[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = addDaysStr(i);
      const label =
        i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(ds + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" });
      const dayItems: { key: string; label: string; meta?: string }[] = [];
      for (const t of todos ?? []) {
        if (!t.done && t.due_date === ds) dayItems.push({ key: `t${t.id}`, label: t.text, meta: t.remind_at ? prettyTime(t.remind_at) : undefined });
      }
      for (const a of apps ?? []) {
        if (a.follow_up_date === ds && a.status !== "closed" && a.status !== "offer")
          dayItems.push({ key: `a${a.id}`, label: `Follow up: ${a.company}`, meta: "job" });
      }
      for (const b of bills ?? []) {
        if (!b.active || b.autopay) continue;
        if (b.last_paid_on && b.last_paid_on.startsWith(ds.slice(0, 7))) continue;
        if (billNextDue(b.due_day) === ds)
          dayItems.push({ key: `b${b.id}`, label: `Pay ${b.name}`, meta: `$${Number(b.amount)}` });
      }
      if (dayItems.length) days.push({ date: ds, label, items: dayItems });
    }
    return days;
  }, [todos, apps, bills]);

  const isEmpty = !todosLoading && sortedAgenda.length === 0;

  return (
    <section className="flex flex-col gap-4">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <h2 className="u-label text-muted-foreground">
          {view === "today" ? "Today" : "This week"}
        </h2>
        <div className="flex rounded-md bg-muted p-0.5 text-xs">
          {(["today", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-[5px] px-2.5 py-1 font-medium capitalize transition-colors",
                view === v
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "today" ? (
        <>
          {/* Do this next */}
          {nextItem && (
            <Card className="gap-0 p-4">
              <div className="u-label mb-2 text-primary">Do this next</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={nextItem.done}
                  className="shrink-0 text-primary transition-opacity hover:opacity-80"
                  aria-label="Complete"
                >
                  <CheckCircle2 className="size-6" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{nextItem.label}</div>
                  {nextItem.meta && (
                    <div className="truncate text-xs text-muted-foreground">{nextItem.meta}</div>
                  )}
                </div>
                <button
                  onClick={() => redirect(`/focus?label=${encodeURIComponent(nextItem.label)}`)}
                  className="flex h-7 shrink-0 items-center gap-1 rounded-md border border-primary/30 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <Timer className="size-3.5" /> Focus
                </button>
              </div>
            </Card>
          )}

          {/* Agenda by band */}
          {todosLoading && sortedAgenda.length === 0 ? (
            <div className="h-32 animate-pulse rounded-lg border bg-muted/40" />
          ) : isEmpty ? (
            <div className="rounded-lg border border-dashed px-4 py-6 text-[13px] text-muted-foreground">
              Nothing scheduled for today. Capture something above, or enjoy the open space.
            </div>
          ) : (
            grouped.map((g) => {
              const Icon = BAND_META[g.band].icon;
              return (
                <div key={g.band}>
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Icon className="size-3.5" />
                    {BAND_META[g.band].label}
                  </div>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
                    {g.items.map((i) => (
                      <AgendaRow key={i.key} item={i} />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* This week so far — rhythm, not streaks */}
          {(doneThisWeek > 0 || focusMinThisWeek > 0) && (
            <div className="flex gap-1.5 text-xs">
              <span className="flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-success">
                <CheckCircle2 className="size-3" /> {doneThisWeek} done this week
              </span>
              {focusMinThisWeek > 0 && (
                <span className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                  <Timer className="size-3" /> {focusMinThisWeek}m focused
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        // Week ahead
        <div className="flex flex-col gap-3">
          {weekAhead.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-6 text-[13px] text-muted-foreground">
              Nothing scheduled this week yet. A clear runway.
            </div>
          ) : (
            weekAhead.map((d) => (
              <div key={d.date}>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">{d.label}</div>
                <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
                  {d.items.map((it) => (
                    <div key={it.key} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.meta && (
                        <span className="text-xs text-muted-foreground">{it.meta}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          {(doneThisWeek > 0 || focusMinThisWeek > 0) && (
            <div className="flex gap-1.5 text-xs">
              <span className="flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-success">
                <CheckCircle2 className="size-3" /> {doneThisWeek} done this week
              </span>
              {focusMinThisWeek > 0 && (
                <span className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                  <Timer className="size-3" /> {focusMinThisWeek}m focused
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const AgendaRow = ({ item }: { item: AgendaItem }) => {
  const KindIcon =
    item.kind === "routine"
      ? Repeat
      : item.kind === "job"
        ? Briefcase
        : item.kind === "bill"
          ? Wallet
          : item.kind === "person"
            ? Users
            : item.kind === "waiting"
              ? Hourglass
          : item.time
            ? Bell
            : Clock;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50">
      <Checkbox
        checked={false}
        onCheckedChange={item.done}
        aria-label={`Complete ${item.label}`}
        className="transition-transform active:scale-90"
      />
      <button
        onClick={item.open ?? item.done}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-[13px] font-medium">{item.label}</div>
        {item.meta && (
          <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <KindIcon className="size-3" />
            {item.meta}
          </div>
        )}
      </button>
      {item.overdue && (
        <span className="shrink-0 text-[11px] font-medium text-warning">carried</span>
      )}
      {item.time && !item.overdue && (
        <span className="shrink-0 text-xs text-muted-foreground">{prettyTime(item.time)}</span>
      )}
    </div>
  );
};
