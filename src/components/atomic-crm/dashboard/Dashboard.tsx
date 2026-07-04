import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useNotify,
  useRedirect,
} from "ra-core";
import {
  Sparkles,
  Zap,
  Inbox,
  Plus,
  ArrowRight,
  LayoutGrid,
  CircleDot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PushReminders } from "../push/PushReminders";
import { TodayView } from "./TodayView";
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
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white p-7 shadow-lg">
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-6 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-white/80 text-sm">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl font-bold mt-1">
            {greeting()}, {firstName}{" "}
            <Sparkles className="inline size-6 -mt-1" />
          </h1>
          <p className="text-white/85 mt-1">{prompt}</p>

          {/* Quick capture */}
          <div className="mt-5 flex gap-2">
            <Input
              value={capture}
              onChange={(e) => setCapture(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCapture()}
              placeholder="Brain-dump anything… (Enter to save)"
              className="bg-white/95 text-foreground border-0 h-11 rounded-xl placeholder:text-muted-foreground"
            />
            <Button
              onClick={submitCapture}
              className="h-11 rounded-xl bg-white text-indigo-700 hover:bg-white/90 font-semibold gap-1"
            >
              <Plus className="size-4" /> Capture
            </Button>
          </div>
          <div className="flex gap-4 mt-4 text-sm text-white/85">
            <span className="flex items-center gap-1">
              <Zap className="size-4" /> {active.length} in motion
            </span>
            <span className="flex items-center gap-1">
              <Inbox className="size-4" /> {someday.length} someday
            </span>
            <span className="flex items-center gap-1">
              <CircleDot className="size-4" /> {soon.length} soon
            </span>
          </div>
        </div>
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
        icon={<Zap className="size-4 text-amber-500" />}
        title="In motion"
        action={() => redirect("/deals")}
        actionLabel="All projects"
      >
        {active.length === 0 ? (
          <EmptyHint text="Nothing active yet. Pull something from Someday when you're ready — no pressure." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.slice(0, 6).map((p) => (
              <ProjectCard
                key={p.id}
                p={p}
                onClick={() => redirect(`/deals/${p.id}/show`)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Quick launch */}
      {hub && hub.length > 0 && (
        <Section
          icon={<LayoutGrid className="size-4 text-indigo-500" />}
          title="Jump back in"
          action={() => redirect("/hub")}
          actionLabel="Command Center"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hub.slice(0, 8).map((t) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-xl border bg-card p-3 hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: t.color ?? "var(--primary)" }}
              >
                <span className="text-sm font-medium truncate">{t.title}</span>
                <ArrowRight className="size-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Someday bucket */}
      <Section
        icon={<Inbox className="size-4 text-violet-500" />}
        title="Someday / Maybe"
        action={() => redirect("/deals")}
        actionLabel="Open bucket"
      >
        {someday.length === 0 ? (
          <EmptyHint text="Your idea bucket is empty. Toss anything up there with the capture bar — future-you will sort it out." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {someday.slice(0, 12).map((p) => (
              <button
                key={p.id}
                onClick={() => redirect(`/deals/${p.id}/show`)}
                className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                {p.name}
              </button>
            ))}
            {someday.length > 12 && (
              <span className="rounded-full px-3 py-1.5 text-sm text-muted-foreground">
                +{someday.length - 12} more
              </span>
            )}
          </div>
        )}
      </Section>
    </div>
  );
};

const Section = ({
  icon,
  title,
  action,
  actionLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
}) => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h2>
      {action && actionLabel && (
        <button
          onClick={action}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {actionLabel} <ArrowRight className="size-3" />
        </button>
      )}
    </div>
    {children}
  </section>
);

const ProjectCard = ({ p, onClick }: { p: Deal; onClick: () => void }) => (
  <Card
    onClick={onClick}
    className="cursor-pointer p-4 hover:shadow-md transition-shadow border-l-4 border-l-amber-400"
  >
    <p className="text-sm font-medium truncate">{p.name}</p>
    {p.description && (
      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
        {p.description}
      </p>
    )}
  </Card>
);

const EmptyHint = ({ text }: { text: string }) => (
  <Card className="p-5 text-sm text-muted-foreground bg-muted/40 border-dashed">
    {text}
  </Card>
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
    <div className="flex flex-wrap gap-2">
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
            className={`rounded-full border px-3.5 py-2 text-sm flex items-center gap-1.5 transition-all active:scale-95 ${
              done || hitTarget
                ? "bg-green-500/15 text-green-500 border-green-500/30"
                : "bg-card hover:bg-accent"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.name}</span>
            {t.kind === "count" && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {sum}
                {t.target ? `/${t.target}` : ""}
              </span>
            )}
            {done && <span>✓</span>}
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
      icon={<Sparkles className="size-4 text-primary" />}
      title="Compass"
      action={() => redirect("/goals")}
      actionLabel="All goals"
    >
      <div className="flex flex-wrap gap-2">
        {active.slice(0, 6).map((g) => {
          const ms = (milestones ?? []).filter((m) => m.goal_id === g.id);
          const done = ms.filter((m) => m.done).length;
          const pct = ms.length ? Math.round((done / ms.length) * 100) : 0;
          return (
            <button
              key={g.id}
              onClick={() => redirect("/goals")}
              className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <span>{g.emoji || "🎯"}</span>
              <span className="max-w-40 truncate">{g.title}</span>
              {ms.length > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {pct}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Section>
  );
};
