import { useMemo, useState } from "react";
import { useGetList, useRedirect } from "ra-core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Todo {
  id: number;
  text: string;
  due_date?: string | null;
  done: boolean;
}
interface Bill {
  id: number;
  name: string;
  amount: number;
  due_day: number;
  active: boolean;
}
interface LifeDate {
  id: number;
  title: string;
  emoji?: string;
  on_date: string;
  repeat_yearly: boolean;
}
interface Application {
  id: number;
  company: string;
  status: string;
  follow_up_date?: string | null;
}
interface Goal {
  id: number;
  title: string;
  emoji?: string;
  status: string;
  target_date?: string | null;
}

interface CalItem {
  key: string;
  label: string;
  color: string;
  to: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const COLORS = {
  todo: "bg-primary",
  bill: "bg-warning",
  date: "bg-muted-foreground/50",
  job: "bg-destructive",
  goal: "bg-success",
};

export const CalendarPage = () => {
  const redirect = useRedirect();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [selected, setSelected] = useState<string>(todayStr());

  const { data: todos } = useGetList<Todo>("todos", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "due_date", order: "ASC" },
  });
  const { data: bills } = useGetList<Bill>("bills", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "due_day", order: "ASC" },
  });
  const { data: dates } = useGetList<LifeDate>("life_dates", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "on_date", order: "ASC" },
  });
  const { data: apps } = useGetList<Application>("applications", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: goals } = useGetList<Goal>("goals", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "position", order: "ASC" },
  });

  // Everything in the shown month, keyed by YYYY-MM-DD.
  const byDay = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    const push = (day: string, item: CalItem) => {
      map.set(day, [...(map.get(day) ?? []), item]);
    };
    const ym = `${year}-${pad(month + 1)}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (const t of todos ?? []) {
      if (!t.done && t.due_date?.startsWith(ym))
        push(t.due_date, {
          key: `t${t.id}`,
          label: t.text,
          color: COLORS.todo,
          to: "/todos",
        });
    }
    for (const b of bills ?? []) {
      if (!b.active) continue;
      const day = `${ym}-${pad(Math.min(b.due_day, daysInMonth))}`;
      push(day, {
        key: `b${b.id}`,
        label: `${b.name} · $${Number(b.amount)}`,
        color: COLORS.bill,
        to: "/money",
      });
    }
    for (const d of dates ?? []) {
      const [, m, dd] = d.on_date.split("-");
      const occurs = d.repeat_yearly
        ? Number(m) === month + 1
        : d.on_date.startsWith(ym);
      if (occurs) {
        // Feb-29 anniversaries land on Feb 28 in non-leap years.
        const day = Number(dd) > daysInMonth ? pad(daysInMonth) : dd;
        push(`${ym}-${day}`, {
          key: `d${d.id}`,
          label: `${d.emoji || "📅"} ${d.title}`,
          color: COLORS.date,
          to: "/dates",
        });
      }
    }
    for (const a of apps ?? []) {
      if (a.follow_up_date?.startsWith(ym) && a.status !== "closed")
        push(a.follow_up_date, {
          key: `a${a.id}`,
          label: `Follow up: ${a.company}`,
          color: COLORS.job,
          to: "/applications",
        });
    }
    for (const g of goals ?? []) {
      if (g.status === "active" && g.target_date?.startsWith(ym))
        push(g.target_date, {
          key: `g${g.id}`,
          label: `${g.emoji || "🎯"} ${g.title} target`,
          color: COLORS.goal,
          to: "/goals",
        });
    }
    return map;
  }, [todos, bills, dates, apps, goals, year, month]);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`,
    ),
  ];
  const today = todayStr();
  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`);
  };
  const selectedItems = byDay.get(selected) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl font-semibold tracking-tight flex-1">
          Calendar
        </h1>
        <button
          onClick={() => move(-1)}
          className="rounded-md border p-2 hover:bg-accent/50"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-medium w-36 text-center">
          {new Date(year, month, 1).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          onClick={() => move(1)}
          className="rounded-md border p-2 hover:bg-accent/50"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <Card className="p-3">
        <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) =>
            day === null ? (
              <div key={`x${i}`} />
            ) : (
              <button
                key={day}
                onClick={() => setSelected(day)}
                className={cn(
                  "aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 text-sm transition-colors",
                  day === selected
                    ? "border-primary bg-primary/10"
                    : day === today
                      ? "border-primary/40"
                      : "border-transparent hover:bg-accent",
                )}
              >
                <span
                  className={cn(day === today && "text-primary font-semibold")}
                >
                  {Number(day.slice(-2))}
                </span>
                <span className="flex gap-0.5 h-1.5">
                  {(byDay.get(day) ?? []).slice(0, 4).map((it) => (
                    <span
                      key={it.key}
                      className={cn("size-1.5 rounded-full", it.color)}
                    />
                  ))}
                </span>
              </button>
            ),
          )}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted-foreground">
        {(
          [
            ["To-dos", COLORS.todo],
            ["Bills", COLORS.bill],
            ["Dates", COLORS.date],
            ["Jobs", COLORS.job],
            ["Goal targets", COLORS.goal],
          ] as const
        ).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1">
            <span className={cn("size-2 rounded-full", color)} />
            {label}
          </span>
        ))}
      </div>

      {/* Selected day */}
      <section className="mt-5">
        <h2 className="u-label mb-2 text-muted-foreground">
          {new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        {selectedItems.length === 0 ? (
          <Card className="border-dashed px-4 py-6 text-[13px] text-muted-foreground">
            Nothing scheduled — open space.
          </Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden p-0">
            {selectedItems.map((it) => (
              <button
                key={it.key}
                onClick={() => redirect(it.to)}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] w-full text-left hover:bg-accent/50"
              >
                <span
                  className={cn("size-2 rounded-full shrink-0", it.color)}
                />
                <span className="truncate">{it.label}</span>
              </button>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
};

CalendarPage.path = "/calendar";
