import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useNotify,
  useRedirect,
} from "ra-core";
import { ArrowUpRight, Check, ChevronRight, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PushReminders } from "../push/PushReminders";
import { TodayView } from "./TodayView";
import { DemonicEye } from "../misc/DemonicEye";
import type { Deal } from "../types";

interface HubItem {
  id: number;
  title: string;
  url: string;
  category: string;
  kind: string;
  color?: string;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Winding down";
};

const PROMPTS = [
  "What's one thing you could do right now?",
  "Capture it before it slips away.",
  "Small steps still count.",
  "You don't have to do it all today.",
  "What would make today feel good?",
  "Pick the easy one first.",
  "Done is better than perfect.",
];

export const Dashboard = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const redirect = useRedirect();
  const [create] = useCreate();
  const [capture, setCapture] = useState("");

  const { data: projects } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "updated_at", order: "DESC" },
  });
  const { data: hub } = useGetList<HubItem>("hub_items", {
    pagination: { page: 1, perPage: 8 },
    sort: { field: "position", order: "ASC" },
  });

  const all = projects ?? [];
  const active = all.filter((p) => p.stage === "active");
  const someday = all.filter((p) => p.stage === "someday");
  const soon = all.filter((p) => p.stage === "soon");

  const firstName = (identity?.fullName || "").split(" ")[0] || "there";
  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length];
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const submitCapture = () => {
    const name = capture.trim();
    if (!name) return;
    setCapture("");
    notify("Captured to Someday", { type: "info" });
    create(
      "deals",
      {
        data: {
          name,
          stage: "someday",
          sales_id: identity?.id ? Number(identity.id) : null,
        },
      },
      {
        onError: () => notify("Could not capture", { type: "error" }),
      },
    );
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 py-2 page-enter stagger relative">
      <DemonicEye size={200} className="absolute top-4 right-4 opacity-15 pointer-events-none z-0" />
      {/* Operations header: greeting left, capture right */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {today} · {prompt}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Plus className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCapture()}
            placeholder="Capture anything…"
            className="h-9 pr-10 pl-8 text-[13px]"
            aria-label="Quick capture — saves to Someday"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border bg-muted px-1 font-sans text-[0.65rem] text-muted-foreground">
            ⏎
          </kbd>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi value={active.length} label="In motion" dotClass="bg-warning" />
        <Kpi value={soon.length} label="Soon" dotClass="bg-primary" />
        <Kpi value={someday.length} label="Someday" dotClass="bg-muted-foreground/50" />
        <Kpi value={all.length} label="Projects total" dotClass="bg-success" />
      </div>

      <PushReminders />

      {/* Unified Today / Week agenda */}
      <TodayView />

      {/* One-tap tracker logging */}
      <QuickLogStrip />

      {/* Compass — active goals at a glance */}
      <CompassStrip />

      {/* In motion */}
      <Section
        title="In motion"
        count={active.length}
        action={() => redirect("/deals")}
        actionLabel="All projects"
      >
        {active.length === 0 ? (
          <EmptyHint text="Nothing active yet. Pull something from Someday when you're ready — no pressure." />
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
            {active.slice(0, 8).map((p) => (
              <button
                key={p.id}
                onClick={() => redirect(`/deals/${p.id}/show`)}
                className="card-interactive flex w-full items-center gap-3 px-4 py-2.5 text-left"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-warning" />
                <span className="shrink-0 text-[13px] font-medium">{p.name}</span>
                {p.description && (
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {p.description}
                  </span>
                )}
                <ChevronRight className="ml-auto size-3.5 shrink-0 text-muted-foreground/50" />
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Quick launch */}
      {hub && hub.length > 0 && (
        <Section
          title="Jump back in"
          action={() => redirect("/hub")}
          actionLabel="Command Center"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 p-3">
            {hub.slice(0, 8).map((t) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-interactive group flex h-9 items-center gap-2 rounded-md border bg-card/70 px-2.5"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color ?? "var(--primary)" }}
                />
                <span className="truncate text-[13px] font-medium">{t.title}</span>
                <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Someday bucket */}
      <Section
        title="Someday / Maybe"
        count={someday.length}
        action={() => redirect("/deals")}
        actionLabel="Open bucket"
      >
        {someday.length === 0 ? (
          <EmptyHint text="Your idea bucket is empty. Toss anything up there with the capture bar — future-you will sort it out." />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {someday.slice(0, 12).map((p) => (
              <button
                key={p.id}
                onClick={() => redirect(`/deals/${p.id}/show`)}
                className="card-interactive rounded-md border bg-card px-2.5 py-1 text-xs"
              >
                {p.name}
              </button>
            ))}
            {someday.length > 12 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{someday.length - 12} more
              </span>
            )}
          </div>
        )}
      </Section>
    </div>
  );
};

const Kpi = ({
  value,
  label,
  dotClass,
  className,
}: {
  value: number | string;
  label: string;
  dotClass: string;
  className?: string;
}) => (
  <div className={cn("metric-tile", className)}>
    <span className="metric-value">{value}</span>
    <span className="metric-label flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full inline-block shrink-0", dotClass)} />
      {label}
    </span>
  </div>
);

const Section = ({
  title,
  count,
  action,
  actionLabel,
  children,
}: {
  title: string;
  count?: number;
  action?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
}) => (
  <section>
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="u-label text-muted-foreground">
        {title}
        {typeof count === "number" && count > 0 && (
          <span className="ml-1.5 font-medium text-muted-foreground/60">
            {count}
          </span>
        )}
      </h2>
      {action && actionLabel && (
        <button
          onClick={action}
          className="btn-press text-xs font-medium text-primary hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
    {children}
  </section>
);

const EmptyHint = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed px-4 py-6 text-[13px] text-muted-foreground">
    {text}
  </div>
);

/** One-tap logging for the first few trackers — no page visit needed. */
const QuickLogStrip = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const [create] = useCreate();
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data: trackers } = useGetList<{
    id: number;
    name: string;
    emoji?: string;
    kind: string;
    unit?: string;
    active?: boolean;
    target?: number | null;
  }>("trackers", {
    pagination: { page: 1, perPage: 20 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: entries } = useGetList<{
    id: number;
    tracker_id: number;
    value?: number | null;
    logged_at: string;
  }>("log_entries", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "logged_at", order: "DESC" },
  });

  const shown = (trackers ?? []).filter((t) => t.active !== false && t.kind !== "note").slice(0, 5);
  if (shown.length === 0) return null;
  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => {
        const todayEntries = (entries ?? []).filter((e) => e.tracker_id === t.id && isToday(e.logged_at));
        const sum = todayEntries.reduce((s, e) => s + Number(e.value ?? 0), 0);
        const done = t.kind === "check" && todayEntries.length > 0;
        const hitTarget = t.target && sum >= Number(t.target);
        return (
          <button
            key={t.id}
            onClick={() => {
              if (t.kind === "scale") {
                redirect("/track");
                return;
              }
              create("log_entries", {
                data: { tracker_id: t.id, value: 1, logged_at: new Date().toISOString(), sales_id: salesId },
              });
            }}
            className={cn(
              "btn-press card-interactive flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px]",
              done || hitTarget
                ? "border-success/40 bg-success/10 text-success"
                : "bg-card",
            )}
          >
            <span>{t.emoji}</span>
            <span className="font-medium">{t.name}</span>
            {t.kind === "count" && (
              <span className="text-xs text-muted-foreground">
                {sum}
                {t.target ? `/${t.target}` : ""}
              </span>
            )}
            {done && <Check className="size-3" />}
          </button>
        );
      })}
    </div>
  );
};

/** Active goals with milestone progress — the "where am I heading" strip. */
const CompassStrip = () => {
  const redirect = useRedirect();
  const { data: goals } = useGetList<{ id: number; title: string; emoji?: string; status: string }>(
    "goals",
    { pagination: { page: 1, perPage: 25 }, sort: { field: "position", order: "ASC" } },
  );
  const { data: milestones } = useGetList<{ id: number; goal_id: number; done: boolean }>(
    "goal_milestones",
    { pagination: { page: 1, perPage: 500 }, sort: { field: "position", order: "ASC" } },
  );
  const active = (goals ?? []).filter((g) => g.status === "active");
  if (active.length === 0) return null;

  return (
    <Section
      title="Compass"
      count={active.length}
      action={() => redirect("/goals")}
      actionLabel="All goals"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {active.slice(0, 6).map((g) => {
          const ms = (milestones ?? []).filter((m) => m.goal_id === g.id);
          const done = ms.filter((m) => m.done).length;
          const pct = ms.length ? Math.round((done / ms.length) * 100) : 0;
          return (
            <button
              key={g.id}
              onClick={() => redirect("/goals")}
              className="card-interactive flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 text-left"
            >
              <span className="flex w-full items-center gap-2">
                <span className="text-sm leading-none">{g.emoji || "🎯"}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {g.title}
                </span>
                {ms.length > 0 && (
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                )}
              </span>
              {ms.length > 0 && (
                <span className="block h-1 w-full overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Section>
  );
};
