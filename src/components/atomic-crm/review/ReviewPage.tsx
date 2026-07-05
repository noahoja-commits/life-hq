import { useState } from "react";
import { useGetList, useGetIdentity, useCreate, useRedirect } from "ra-core";
import {
  CalendarCheck,
  CheckCircle2,
  Timer,
  Activity,
  Repeat,
  Briefcase,
  ArrowRight,
  Sun,
  Compass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { EmptyState } from "../misc/EmptyState";
import { usePageHotkey } from "../misc/usePageHotkey";

interface Todo {
  id: number;
  text: string;
  due_date?: string | null;
  done: boolean;
  done_at?: string | null;
  created_at: string;
}
interface FocusSession {
  id: number;
  actual_minutes?: number | null;
  completed: boolean;
  started_at: string;
}
interface Tracker {
  id: number;
  name: string;
  emoji?: string;
  kind: string;
  unit?: string;
  active: boolean;
}
interface LogEntry {
  id: number;
  tracker_id: number;
  value?: number | null;
  logged_at: string;
}
interface Routine {
  id: number;
  name: string;
  emoji?: string;
}
interface Step {
  id: number;
  routine_id: number;
}
interface Check {
  id: number;
  step_id: number;
  checked_on: string;
}
interface Application {
  id: number;
  company: string;
  status: string;
  follow_up_date?: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const dstr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};
const daysAhead = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dstr(d);
};

/**
 * Weekly Review — a warm, streak-free look back at the last 7 days and a
 * light look at the 7 ahead. Retrospective memory prosthetic, zero shame.
 */
export const ReviewPage = () => {
  const redirect = useRedirect();
  const windowStart = daysAgo(6); // today + previous 6 days
  const today = dstr(new Date());
  const weekAheadEnd = daysAhead(7);

  usePageHotkey("n", () => redirect("/todos"));

  const { data: todos, isLoading } = useGetList<Todo>("todos", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "created_at", order: "DESC" },
  });
  const { data: focus } = useGetList<FocusSession>("focus_sessions", {
    pagination: { page: 1, perPage: 300 },
    sort: { field: "started_at", order: "DESC" },
  });
  const { data: trackers } = useGetList<Tracker>("trackers", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: entries } = useGetList<LogEntry>("log_entries", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "logged_at", order: "DESC" },
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
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "checked_on", order: "DESC" },
  });
  const { data: apps } = useGetList<Application>("applications", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "position", order: "ASC" },
  });

  const inWindow = (iso?: string | null) =>
    !!iso && new Date(iso).getTime() >= windowStart.getTime();

  // ── Done this week ─────────────────────────────────────────────────────
  const doneTodos = (todos ?? []).filter((t) => t.done && inWindow(t.done_at));
  const capturedTodos = (todos ?? []).filter((t) =>
    inWindow(t.created_at),
  ).length;

  // ── Focus ──────────────────────────────────────────────────────────────
  const focusSessions = (focus ?? []).filter(
    (f) => f.completed && inWindow(f.started_at),
  );
  const focusMinutes = focusSessions.reduce(
    (s, f) => s + (f.actual_minutes ?? 0),
    0,
  );

  // ── Tracker activity (days active in the last 7) ──────────────────────
  const weekEntries = (entries ?? []).filter((e) => inWindow(e.logged_at));
  const trackerStats = (trackers ?? [])
    .filter((t) => t.active !== false)
    .map((t) => {
      const mine = weekEntries.filter((e) => e.tracker_id === t.id);
      const days = new Set(mine.map((e) => dstr(new Date(e.logged_at)))).size;
      const total = mine.reduce((s, e) => s + Number(e.value ?? 1), 0);
      return { t, days, total, count: mine.length };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.days - a.days);

  // ── Routine consistency ────────────────────────────────────────────────
  const weekDays: string[] = [];
  for (let i = 6; i >= 0; i--) weekDays.push(dstr(new Date(daysAgo(i))));
  const routineStats = (routines ?? [])
    .map((r) => {
      const stepIds = new Set(
        (steps ?? []).filter((s) => s.routine_id === r.id).map((s) => s.id),
      );
      if (stepIds.size === 0) return null;
      const activeDaysSet = new Set(
        (checks ?? [])
          .filter(
            (c) => stepIds.has(c.step_id) && weekDays.includes(c.checked_on),
          )
          .map((c) => c.checked_on),
      );
      return { r, days: activeDaysSet.size };
    })
    .filter((x): x is { r: Routine; days: number } => !!x && x.days > 0);

  // ── Jobs ───────────────────────────────────────────────────────────────
  const activeApps = (apps ?? []).filter((a) => a.status !== "closed");
  const interviewing = activeApps.filter(
    (a) => a.status === "interview",
  ).length;

  // ── Coming up (next 7 days) ────────────────────────────────────────────
  const upcomingTodos = (todos ?? []).filter(
    (t) =>
      !t.done && t.due_date && t.due_date > today && t.due_date <= weekAheadEnd,
  );
  const upcomingFollowUps = (apps ?? []).filter(
    (a) =>
      a.follow_up_date &&
      a.follow_up_date > today &&
      a.follow_up_date <= weekAheadEnd &&
      a.status !== "closed" &&
      a.status !== "offer",
  );

  const nothingHappened =
    doneTodos.length === 0 &&
    focusMinutes === 0 &&
    trackerStats.length === 0 &&
    routineStats.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
      <h1 className="text-xl font-semibold tracking-tight">Weekly Review</h1>
      <p className="text-[13px] text-muted-foreground -mt-3">
        The last 7 days — what you showed up for. No streaks, no scores.
      </p>

      {/* Headline chips */}
      <div className="flex flex-wrap gap-2">
        <Chip
          icon={CheckCircle2}
          tone="border-success/30 bg-success/10 text-success"
        >
          {doneTodos.length} done
        </Chip>
        {focusMinutes > 0 && (
          <Chip
            icon={Timer}
            tone="border-primary/30 bg-primary/10 text-primary"
          >
            {focusMinutes}m focused · {focusSessions.length} session
            {focusSessions.length === 1 ? "" : "s"}
          </Chip>
        )}
        {capturedTodos > 0 && (
          <Chip icon={ArrowRight} tone="border bg-card text-muted-foreground">
            {capturedTodos} captured
          </Chip>
        )}
        {interviewing > 0 && (
          <Chip
            icon={Briefcase}
            tone="border-warning/30 bg-warning/10 text-warning"
          >
            {interviewing} interviewing
          </Chip>
        )}
      </div>

      {isLoading && !todos ? (
        <CardsSkeleton
          count={3}
          className="grid grid-cols-1 gap-4"
        />
      ) : nothingHappened ? (
        <EmptyState
          icon={CalendarCheck}
          title="A quiet week"
          description="That's allowed. Next week is a fresh page."
          action={{ label: "Capture something", onClick: () => redirect("/todos") }}
        />
      ) : null}

      {/* Wins */}
      {doneTodos.length > 0 && (
        <Section
          icon={CheckCircle2}
          title="Checked off"
          count={doneTodos.length}
        >
          <Card className="divide-y divide-border overflow-hidden p-0">
            {doneTodos.slice(0, 12).map((t) => (
              <div
                key={t.id}
                className="px-4 py-2 text-[13px] text-muted-foreground line-through"
              >
                {t.text}
              </div>
            ))}
            {doneTodos.length > 12 && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                +{doneTodos.length - 12} more
              </div>
            )}
          </Card>
        </Section>
      )}

      {/* Trackers */}
      {trackerStats.length > 0 && (
        <Section icon={Activity} title="Tracked">
          <Card className="divide-y divide-border overflow-hidden p-0">
            {trackerStats.map(({ t, days, total }) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
              >
                <span>{t.emoji}</span>
                <span className="flex-1 truncate">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {days} day{days === 1 ? "" : "s"}
                  {t.kind === "count"
                    ? ` · ${Number.isInteger(total) ? total : total.toFixed(1)}${t.unit ? ` ${t.unit}` : ""}`
                    : ""}
                </span>
                <DayDots days={days} />
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Routines */}
      {routineStats.length > 0 && (
        <Section icon={Repeat} title="Routines">
          <Card className="divide-y divide-border overflow-hidden p-0">
            {routineStats.map(({ r, days }) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
              >
                <span>{r.emoji}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  showed up {days}/7 days
                </span>
                <DayDots days={days} />
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Life balance pulse */}
      <BalanceSection />

      {/* Coming up */}
      {(upcomingTodos.length > 0 || upcomingFollowUps.length > 0) && (
        <Section icon={Sun} title="Coming up this week">
          <Card className="divide-y divide-border overflow-hidden p-0">
            {upcomingTodos
              .sort((a, b) =>
                (a.due_date ?? "").localeCompare(b.due_date ?? ""),
              )
              .slice(0, 8)
              .map((t) => (
                <button
                  key={`t${t.id}`}
                  onClick={() => redirect("/todos")}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] w-full text-left hover:bg-accent/50"
                >
                  <span className="flex-1 truncate">{t.text}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(t.due_date + "T00:00:00").toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                      },
                    )}
                  </span>
                </button>
              ))}
            {upcomingFollowUps.map((a) => (
              <button
                key={`a${a.id}`}
                onClick={() => redirect("/applications")}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] w-full text-left hover:bg-accent/50"
              >
                <Briefcase className="size-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">Follow up: {a.company}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.follow_up_date + "T00:00:00").toLocaleDateString(
                    undefined,
                    {
                      weekday: "short",
                    },
                  )}
                </span>
              </button>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
};

ReviewPage.path = "/review";

const Chip = ({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof CheckCircle2;
  tone: string;
  children: React.ReactNode;
}) => (
  <span
    className={`rounded-md border px-2.5 py-1 text-xs flex items-center gap-1.5 ${tone}`}
  >
    <Icon className="size-3.5" />
    {children}
  </span>
);

const Section = ({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof CheckCircle2;
  title: string;
  count?: number;
  children: React.ReactNode;
}) => (
  <section>
    <h2 className="u-label flex items-center gap-2 text-muted-foreground mb-2">
      <Icon className="size-3.5" />
      {title}
      {typeof count === "number" && count > 0 && (
        <span className="font-medium text-muted-foreground/60">{count}</span>
      )}
    </h2>
    {children}
  </section>
);

const DayDots = ({ days }: { days: number }) => (
  <span className="flex gap-0.5 shrink-0">
    {Array.from({ length: 7 }).map((_, i) => (
      <span
        key={i}
        className={`size-1.5 rounded-full ${i < days ? "bg-primary" : "bg-muted"}`}
      />
    ))}
  </span>
);

// ── Life balance pulse (periodic 1–5 self-check across domains) ─────────────
const DOMAINS = [
  "Health",
  "Sleep",
  "Money",
  "Work",
  "Social",
  "Growth",
  "Fun",
  "Home",
];

interface BalanceCheck {
  id: number;
  checked_on: string;
  scores: Record<string, number>;
}

const BalanceSection = () => {
  const { identity } = useGetIdentity();
  const [create] = useCreate();
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(DOMAINS.map((d) => [d, 3])),
  );

  const { data } = useGetList<BalanceCheck>("balance_checks", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "checked_on", order: "DESC" },
  });
  const latest = data?.[0];
  const previous = data?.[1];

  const submit = () => {
    create(
      "balance_checks",
      {
        data: {
          scores,
          checked_on: dstr(new Date()),
          sales_id: identity?.id ? Number(identity.id) : null,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Section icon={Compass} title="Life balance">
      <Card className="p-4 flex flex-col gap-3">
        {latest ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
              {DOMAINS.map((d) => {
                const v = Number(latest.scores?.[d] ?? 0);
                const prev = previous
                  ? Number(previous.scores?.[d] ?? 0)
                  : null;
                const delta = prev !== null ? v - prev : 0;
                return (
                  <div key={d} className="flex items-center gap-2">
                    <span className="text-xs w-14 text-muted-foreground">
                      {d}
                    </span>
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(v / 5) * 100}%`,
                          backgroundColor:
                            v >= 4
                              ? "var(--success)"
                              : v >= 3
                                ? "var(--primary)"
                                : "var(--warning)",
                        }}
                      />
                    </div>
                    {delta !== 0 && (
                      <span
                        className={`text-[10px] ${delta > 0 ? "text-success" : "text-warning"}`}
                      >
                        {delta > 0 ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Last check-in{" "}
              {new Date(latest.checked_on + "T00:00:00").toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                },
              )}
              {previous ? " · arrows vs previous" : ""}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            A 30-second pulse across 8 life areas — do it weekly-ish and watch
            where life needs a little attention. No scores to beat.
          </p>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={() => setOpen(true)}
        >
          Check in now
        </Button>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How's each area feeling?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1">
            {DOMAINS.map((d) => (
              <div key={d} className="flex items-center gap-3">
                <span className="text-sm w-16">{d}</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={scores[d]}
                  onChange={(e) =>
                    setScores({ ...scores, [d]: Number(e.target.value) })
                  }
                  className="flex-1 accent-[var(--primary)]"
                  aria-label={`${d} score`}
                />
                <span className="text-sm tabular-nums w-4 text-right">
                  {scores[d]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save check-in</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
};
