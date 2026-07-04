import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import { CalendarHeart, Plus, Trash2, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useConfirm } from "../misc/useConfirm";
import { CardsSkeleton } from "../misc/CardsSkeleton";

export interface LifeDate {
  id: number;
  title: string;
  emoji?: string;
  on_date: string;
  repeat_yearly: boolean;
  remind_days_before: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Feb-29 anniversaries fall back to Feb 28 in non-leap years.
const safeDate = (s: string): string =>
  Number.isNaN(new Date(s + "T00:00:00").getTime()) ? s.replace("-02-29", "-02-28") : s;

/** Next occurrence (this year or next for yearly; the date itself otherwise). */
export const nextOccurrence = (d: LifeDate): string => {
  if (!d.repeat_yearly) return d.on_date;
  const today = todayStr();
  const [, m, day] = d.on_date.split("-");
  const thisYear = safeDate(`${today.slice(0, 4)}-${m}-${day}`);
  if (thisYear >= today) return thisYear;
  return safeDate(`${Number(today.slice(0, 4)) + 1}-${m}-${day}`);
};
const daysUntil = (iso: string) =>
  Math.round((new Date(iso + "T00:00:00").getTime() - new Date(todayStr() + "T00:00:00").getTime()) / 86400000);

export const DatesPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const { confirm, confirmUI } = useConfirm();
  const salesId = identity?.id ? Number(identity.id) : null;

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [date, setDate] = useState("");
  const [yearly, setYearly] = useState(true);

  const { data, isPending } = useGetList<LifeDate>("life_dates", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "on_date", order: "ASC" },
  });
  const dates = (data ?? [])
    .map((d) => ({ d, next: nextOccurrence(d), days: daysUntil(nextOccurrence(d)) }))
    .filter((x) => x.days >= 0 || x.d.repeat_yearly)
    .sort((a, b) => a.days - b.days);

  const add = () => {
    if (!title.trim() || !date) return;
    create(
      "life_dates",
      {
        data: {
          title: title.trim(),
          emoji: emoji.trim(),
          on_date: date,
          repeat_yearly: yearly,
          sales_id: salesId,
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setEmoji("");
          setDate("");
        },
        onError: () => notify("Could not add date", { type: "error" }),
      },
    );
  };

  const countdownLabel = (days: number) =>
    days === 0 ? "Today! 🎉" : days === 1 ? "Tomorrow" : `${days} days`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <CalendarHeart className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Dates</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Birthdays, anniversaries, renewals, deadlines — with countdowns and a
        heads-up push before each one.
      </p>

      {/* Add */}
      <Card className="p-3 mb-6 flex flex-wrap gap-2 items-center">
        <Input className="w-14 text-center" placeholder="🎂" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <Input
          className="flex-1 min-w-40"
          placeholder="Mom's birthday, lease renewal…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border px-2 py-1.5 bg-transparent text-sm"
          aria-label="Date"
        />
        <button
          onClick={() => setYearly((y) => !y)}
          className={cn(
            "text-xs rounded-full px-2.5 py-1.5 border transition-colors",
            yearly ? "bg-primary/15 text-primary border-primary/30" : "hover:bg-accent",
          )}
        >
          {yearly ? "Every year" : "One time"}
        </button>
        <Button onClick={add} size="icon" className="rounded-full shrink-0" aria-label="Add date">
          <Plus className="size-4" />
        </Button>
      </Card>

      {isPending && dates.length === 0 ? (
        <CardsSkeleton count={3} className="grid grid-cols-1 gap-2" />
      ) : dates.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
          Nothing yet. Add the dates you never want to be surprised by.
        </Card>
      ) : (
        <Card className="divide-y p-0">
          {dates.map(({ d, next, days }) => (
            <div key={d.id} className="group flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{d.emoji || "📅"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(next + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                  })}
                  {d.repeat_yearly ? " · yearly" : ""}
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums shrink-0",
                  days <= 3 ? "text-amber-400" : days <= 14 ? "text-primary" : "text-muted-foreground",
                )}
              >
                {countdownLabel(days)}
              </span>
              <Select
                value={String(d.remind_days_before)}
                onValueChange={(v) =>
                  update(
                    "life_dates",
                    { id: d.id, data: { remind_days_before: Number(v) }, previousData: d },
                    { mutationMode: "optimistic" },
                  )
                }
              >
                <SelectTrigger className="h-7 w-24 text-xs shrink-0" aria-label="Remind before">
                  <Bell className="size-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 7, 14, 30].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}d before
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => confirm(`Delete "${d.title}"?`, () => remove("life_dates", { id: d.id, previousData: d }, { mutationMode: "optimistic" }))}
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${d.title}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </Card>
      )}
      {confirmUI}

      {/* Keep in touch */}
      <KeepInTouchSection />
    </div>
  );
};

DatesPage.path = "/dates";

// ── Keep in touch: cadence per person; lapsed ones surface on Today ────────
interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  touch_cadence_days?: number | null;
  last_touch_on?: string | null;
}

const CADENCES = [7, 14, 30, 60, 90];

const KeepInTouchSection = () => {
  const [update] = useUpdate();
  const { data } = useGetList<Person>("contacts", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "last_seen", order: "DESC" },
  });
  const people = data ?? [];
  const withCadence = people.filter((p) => p.touch_cadence_days);
  const without = people.filter((p) => !p.touch_cadence_days);
  const name = (p: Person) => `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed";

  const setCadence = (p: Person, days: number | null) =>
    update(
      "contacts",
      { id: p.id, data: { touch_cadence_days: days }, previousData: p },
      { mutationMode: "optimistic" },
    );

  const daysSince = (p: Person) =>
    p.last_touch_on
      ? Math.round(
          (new Date(todayStr() + "T00:00:00").getTime() -
            new Date(p.last_touch_on + "T00:00:00").getTime()) /
            86400000,
        )
      : null;

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        Keep in touch
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Pick how often per person — when it lapses, "Reach out to…" shows up on
        Today. Checking it off marks them touched.
      </p>
      <Card className="p-0 divide-y">
        {withCadence.map((p) => {
          const ds = daysSince(p);
          const lapsed = ds === null || ds >= (p.touch_cadence_days ?? 9999);
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="flex-1 truncate">{name(p)}</span>
              <span className={cn("text-xs shrink-0", lapsed ? "text-amber-500" : "text-muted-foreground")}>
                {ds === null ? "never" : ds === 0 ? "today" : `${ds}d ago`}
              </span>
              <Select
                value={String(p.touch_cadence_days)}
                onValueChange={(v) => setCadence(p, v === "off" ? null : Number(v))}
              >
                <SelectTrigger className="h-7 w-28 text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      every {n}d
                    </SelectItem>
                  ))}
                  <SelectItem value="off">off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
        {without.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Select value="" onValueChange={(v) => {
              const p = people.find((x) => x.id === Number(v));
              if (p) setCadence(p, 30);
            }}>
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="+ Add a person (starts at every 30d)" />
              </SelectTrigger>
              <SelectContent>
                {without.slice(0, 100).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {name(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>
    </section>
  );
};
