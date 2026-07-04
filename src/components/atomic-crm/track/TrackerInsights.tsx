import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { Heatmap } from "./Heatmap";

type Kind = "check" | "count" | "scale" | "note";

interface Tracker {
  id: number;
  name: string;
  kind: Kind;
  unit?: string;
  color?: string;
  emoji?: string;
  remind_time?: string | null;
}
interface LogEntry {
  id: number;
  tracker_id: number;
  value?: number | null;
  note?: string | null;
  logged_at: string;
}

const WEEKS = 13;
const localDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const TrackerInsights = ({
  tracker,
  entries,
  onClose,
  onDelete,
  onLog,
  onRemindTime,
}: {
  tracker: Tracker;
  entries: LogEntry[];
  onClose: () => void;
  onDelete: (id: number) => void;
  onLog: (
    value: number | null,
    note: string | null,
    loggedAtISO: string,
  ) => void;
  onRemindTime?: (t: string | null) => void;
}) => {
  const mine = entries.filter((e) => e.tracker_id === tracker.id);
  const [logVal, setLogVal] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logDate, setLogDate] = useState("");

  const submitLog = () => {
    const iso = logDate
      ? new Date(logDate + "T12:00:00").toISOString()
      : new Date().toISOString();
    let value: number | null = null;
    let note: string | null = null;
    if (tracker.kind === "note") {
      if (!logNote.trim()) return;
      note = logNote.trim();
    } else if (tracker.kind === "check") {
      value = 1;
    } else {
      if (logVal === "") return;
      value = Number(logVal);
      if (Number.isNaN(value)) return;
    }
    onLog(value, note, iso);
    setLogVal("");
    setLogNote("");
    setLogDate("");
  };

  // Aggregate per calendar day.
  const perDay = new Map<string, { sum: number; count: number }>();
  for (const e of mine) {
    const d = localDate(e.logged_at);
    const cur = perDay.get(d) ?? { sum: 0, count: 0 };
    cur.sum += Number(e.value ?? (tracker.kind === "check" ? 1 : 0));
    cur.count += 1;
    perDay.set(d, cur);
  }

  const dayValue = (d: string): number => {
    const agg = perDay.get(d);
    if (!agg) return 0;
    if (tracker.kind === "check") return agg.count;
    if (tracker.kind === "count") return agg.sum;
    if (tracker.kind === "scale") return agg.sum / agg.count; // avg
    return agg.count;
  };

  const accent = tracker.color ?? "var(--primary)";

  // Stats — this week = from Sunday through today.
  const today = new Date();
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - today.getDay());
  let last7Total = 0;
  for (let day = 0; day < 7; day++) {
    const cell = new Date(thisSunday);
    cell.setDate(thisSunday.getDate() + day);
    if (cell > today) break;
    last7Total += dayValue(dateStr(cell));
  }
  const activeDays = [...perDay.values()].length;
  const total = mine.reduce(
    (s, e) => s + Number(e.value ?? (tracker.kind === "check" ? 1 : 0)),
    0,
  );
  const avgPerActiveDay = activeDays > 0 ? total / activeDays : 0;

  const stat = (label: string, value: string) => (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {tracker.emoji} {tracker.name}
          </DialogTitle>
        </DialogHeader>

        {/* Heatmap */}
        <Heatmap dayValue={dayValue} weeks={WEEKS} accent={accent} />
        <p className="text-xs text-muted-foreground -mt-1">
          Last {WEEKS} weeks · no streaks, just your rhythm
        </p>

        {/* Daily nudge — pushed at this local time if nothing logged yet */}
        {onRemindTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Daily nudge</span>
            <input
              type="time"
              value={(tracker.remind_time ?? "").slice(0, 5)}
              onChange={(e) => onRemindTime(e.target.value || null)}
              className="rounded-md border px-2 py-1 bg-transparent"
              aria-label="Daily nudge time"
            />
            {tracker.remind_time && (
              <button
                onClick={() => onRemindTime(null)}
                className="underline hover:text-destructive"
              >
                off
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-2">
          {stat("Active days", String(activeDays))}
          {stat(
            tracker.kind === "scale" ? "Avg" : "Total",
            tracker.kind === "scale"
              ? fmt(avgPerActiveDay)
              : `${fmt(total)}${tracker.unit ? " " + tracker.unit : ""}`,
          )}
          {stat("This week", fmt(last7Total))}
          {stat("Per active day", fmt(avgPerActiveDay))}
        </div>

        {/* Log an entry (precise value + optional backdate) */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {tracker.kind === "note" ? (
            <Input
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitLog()}
              placeholder="Note…"
              className="h-9 flex-1 min-w-[8rem]"
            />
          ) : tracker.kind === "check" ? (
            <span className="text-sm text-muted-foreground flex-1">
              Log a check for a chosen day
            </span>
          ) : (
            <Input
              type="number"
              value={logVal}
              onChange={(e) => setLogVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitLog()}
              placeholder={
                tracker.kind === "scale" ? "1–5" : tracker.unit || "amount"
              }
              className="h-9 w-28"
            />
          )}
          <Input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="h-9 w-40"
            aria-label="Date (defaults to now)"
          />
          <Button size="sm" onClick={submitLog} className="gap-1 h-9">
            <Plus className="size-4" /> Log
          </Button>
        </div>

        {/* Recent history (editable) */}
        {mine.length > 0 && (
          <div className="mt-2">
            <h3 className="u-label mb-2 text-muted-foreground">
              Recent
              <span className="ml-1.5 font-medium text-muted-foreground/60">
                {mine.length}
              </span>
            </h3>
            <div className="max-h-52 divide-y divide-border overflow-auto rounded-lg border bg-card">
              {[...mine]
                .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
                .slice(0, 30)
                .map((e) => (
                  <div
                    key={e.id}
                    className="group flex items-center gap-2 px-4 py-2.5 text-[13px]"
                  >
                    <span className="text-muted-foreground text-xs w-28 shrink-0">
                      {new Date(e.logged_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {new Date(e.logged_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex-1 truncate">
                      {e.note
                        ? e.note
                        : e.value != null
                          ? `${fmt(Number(e.value))}${tracker.unit ? " " + tracker.unit : ""}`
                          : "✓"}
                    </span>
                    <button
                      onClick={() => onDelete(e.id)}
                      className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
