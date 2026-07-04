import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import { Plus, Check, BarChart3 } from "lucide-react";
import { TrackerInsights } from "./TrackerInsights";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Kind = "check" | "count" | "scale" | "note";

interface Tracker {
  id: number;
  name: string;
  category: string;
  kind: Kind;
  unit?: string;
  color?: string;
  emoji?: string;
  position: number;
  target?: number | null;
  remind_time?: string | null;
}

interface LogEntry {
  id: number;
  tracker_id: number;
  value?: number | null;
  note?: string | null;
  logged_at: string;
}

const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();

export const TrackPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const [addOpen, setAddOpen] = useState(false);
  const [noteFor, setNoteFor] = useState<Tracker | null>(null);
  const [insightsFor, setInsightsFor] = useState<Tracker | null>(null);

  const {
    data: trackers,
    refetch: refetchTrackers,
    isPending: trackersLoading,
  } = useGetList<Tracker>("trackers", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "position", order: "ASC" },
  });
  const { data: entries, refetch: refetchEntries } = useGetList<LogEntry>(
    "log_entries",
    {
      pagination: { page: 1, perPage: 300 },
      sort: { field: "logged_at", order: "DESC" },
    },
  );

  const allTrackers = trackers ?? [];
  const allEntries = entries ?? [];
  const today = allEntries.filter((e) => isToday(e.logged_at));
  const weekAgo = Date.now() - 7 * 864e5;
  const weekEntries = allEntries.filter(
    (e) => new Date(e.logged_at).getTime() >= weekAgo,
  );
  const categories = Array.from(new Set(allTrackers.map((t) => t.category)));

  const weekStatFor = (t: Tracker) => {
    const wf = weekEntries.filter((e) => e.tracker_id === t.id);
    const sum = wf.reduce((s, e) => s + Number(e.value ?? 0), 0);
    if (t.kind === "count")
      return `${sum}${t.unit ? " " + t.unit : ""} this week`;
    if (t.kind === "check") return `${wf.length}× this week`;
    if (t.kind === "scale")
      return wf.length ? `avg ${(sum / wf.length).toFixed(1)} this week` : "";
    return `${wf.length} notes this week`;
  };

  const log = (
    t: Tracker,
    value: number | null,
    note?: string | null,
    loggedAt?: string,
  ) => {
    create(
      "log_entries",
      {
        data: {
          tracker_id: t.id,
          sales_id: identity?.id ? Number(identity.id) : null,
          value,
          note: note ?? null,
          ...(loggedAt ? { logged_at: loggedAt } : {}),
        },
      },
      {
        onSuccess: () => {
          notify(`${t.emoji ?? ""} ${t.name} logged`, { type: "info" });
          refetchEntries();
        },
        onError: () => notify("Could not log", { type: "error" }),
      },
    );
  };

  const delEntry = (id: number) =>
    remove(
      "log_entries",
      { id, previousData: { id } },
      { onSuccess: () => refetchEntries() },
    );

  const todayFor = (id: number) => today.filter((e) => e.tracker_id === id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Track</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> New tracker
        </Button>
      </div>

      {trackersLoading && allTrackers.length === 0 ? (
        <CardsSkeleton count={6} />
      ) : allTrackers.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-[13px] text-muted-foreground">
          No trackers yet. Add the first thing you want to track.
        </div>
      ) : (
        categories.map((cat) => {
          const large = cat === "Business";
          return (
            <section key={cat} className="mb-8">
              <h2 className="u-label mb-2 text-muted-foreground">{cat}</h2>
              <div
                className={
                  large
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                    : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                }
              >
                {allTrackers
                  .filter((t) => t.category === cat)
                  .map((t) => (
                    <TrackerTile
                      key={t.id}
                      tracker={t}
                      todayEntries={todayFor(t.id)}
                      large={large}
                      weekStat={weekStatFor(t)}
                      onLog={(v) => log(t, v)}
                      onNote={() => setNoteFor(t)}
                      onInsights={() => setInsightsFor(t)}
                    />
                  ))}
              </div>
            </section>
          );
        })
      )}

      {/* Today feed */}
      {today.length > 0 && (
        <section className="mb-8">
          <h2 className="u-label mb-2 text-muted-foreground">Today</h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
            {today.slice(0, 20).map((e) => {
              const t = allTrackers.find((x) => x.id === e.tracker_id);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
                >
                  <span>{t?.emoji ?? "•"}</span>
                  <span className="font-medium">{t?.name ?? "Entry"}</span>
                  <span className="text-muted-foreground">
                    {e.note
                      ? e.note
                      : e.value != null
                        ? `${e.value}${t?.unit ? " " + t.unit : ""}`
                        : "✓"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(e.logged_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {insightsFor && (
        <TrackerInsights
          tracker={insightsFor}
          entries={allEntries}
          onClose={() => setInsightsFor(null)}
          onDelete={delEntry}
          onLog={(v, n, iso) => log(insightsFor, v, n, iso)}
          onRemindTime={(t) => {
            update(
              "trackers",
              {
                id: insightsFor.id,
                data: { remind_time: t },
                previousData: insightsFor,
              },
              { mutationMode: "optimistic" },
            );
            setInsightsFor({ ...insightsFor, remind_time: t });
          }}
        />
      )}
      {noteFor && (
        <NoteDialog
          tracker={noteFor}
          onClose={() => setNoteFor(null)}
          onSave={(note) => {
            log(noteFor, null, note);
            setNoteFor(null);
          }}
        />
      )}
      {addOpen && (
        <AddTrackerDialog
          existingCategories={categories}
          onClose={() => setAddOpen(false)}
          onAdded={(data) =>
            create(
              "trackers",
              {
                data: {
                  ...data,
                  sales_id: identity?.id ? Number(identity.id) : null,
                  position: 999,
                },
              },
              {
                onSuccess: () => {
                  notify("Tracker added", { type: "info" });
                  setAddOpen(false);
                  refetchTrackers();
                },
                onError: () =>
                  notify("Could not add tracker", { type: "error" }),
              },
            )
          }
        />
      )}
    </div>
  );
};

TrackPage.path = "/track";

const TrackerTile = ({
  tracker,
  todayEntries,
  large,
  weekStat,
  onLog,
  onNote,
  onInsights,
}: {
  tracker: Tracker;
  todayEntries: LogEntry[];
  large?: boolean;
  weekStat?: string;
  onLog: (value: number | null) => void;
  onNote: () => void;
  onInsights: () => void;
}) => {
  const sum = todayEntries.reduce((s, e) => s + Number(e.value ?? 0), 0);
  const count = todayEntries.length;
  const lastScale = todayEntries[0]?.value ?? null;
  const done = count > 0;

  const accent = tracker.color ?? "var(--primary)";
  // Gentle daily goal progress (never red-on-shortfall — progress, not shame).
  const target = tracker.target ? Number(tracker.target) : null;
  const progressValue =
    tracker.kind === "count" ? sum : tracker.kind === "check" ? count : null;
  const progressPct =
    target && progressValue !== null
      ? Math.min(100, Math.round((progressValue / target) * 100))
      : null;

  return (
    <Card
      className={`flex flex-col gap-2 border-l-4 ${large ? "p-5" : "p-4"}`}
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-center gap-2">
        <span className={large ? "text-2xl" : "text-lg"}>{tracker.emoji}</span>
        <button
          onClick={onInsights}
          className={`font-medium truncate text-left hover:text-primary transition-colors ${large ? "text-base" : "text-sm"}`}
        >
          {tracker.name}
        </button>
        {tracker.kind === "check" && done && (
          <Check className="size-4 text-success" />
        )}
        <button
          onClick={onInsights}
          aria-label={`${tracker.name} history`}
          className="ml-auto text-muted-foreground hover:text-primary"
        >
          <BarChart3 className="size-4" />
        </button>
      </div>
      {large && weekStat && (
        <p className="text-xs text-muted-foreground -mt-1">{weekStat}</p>
      )}

      {tracker.kind === "check" && (
        <button
          onClick={() => onLog(1)}
          className={`rounded-md py-2 text-sm font-medium transition-colors ${
            done ? "bg-success/10 text-success" : "bg-accent hover:bg-accent/70"
          }`}
        >
          {done ? `Done ×${count}` : "Mark done"}
        </button>
      )}

      {tracker.kind === "count" && (
        <button
          onClick={() => onLog(1)}
          className="rounded-md py-2 text-sm font-medium bg-accent hover:bg-accent/70 transition-colors"
        >
          +1 · {sum}
          {tracker.unit ? ` ${tracker.unit}` : ""} today
        </button>
      )}

      {tracker.kind === "scale" && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onLog(n)}
              className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${
                lastScale === n
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent hover:bg-accent/70"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {tracker.kind === "note" && (
        <button
          onClick={onNote}
          className="rounded-md py-2 text-sm font-medium bg-accent hover:bg-accent/70 transition-colors"
        >
          Add note {count > 0 ? `· ${count}` : ""}
        </button>
      )}

      {progressPct !== null && target && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct >= 100 ? "var(--success)" : accent,
              }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            {progressValue}/{target}
            {tracker.unit ? ` ${tracker.unit}` : ""}
          </span>
        </div>
      )}
    </Card>
  );
};

const NoteDialog = ({
  tracker,
  onClose,
  onSave,
}: {
  tracker: Tracker;
  onClose: () => void;
  onSave: (note: string) => void;
}) => {
  const [note, setNote] = useState("");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tracker.emoji} {tracker.name}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          autoFocus
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind?"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => note.trim() && onSave(note.trim())}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AddTrackerDialog = ({
  existingCategories,
  onClose,
  onAdded,
}: {
  existingCategories: string[];
  onClose: () => void;
  onAdded: (data: {
    name: string;
    category: string;
    kind: Kind;
    unit: string | null;
    emoji: string;
    target: number | null;
  }) => void;
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(existingCategories[0] ?? "Life");
  const [kind, setKind] = useState<Kind>("check");
  const [unit, setUnit] = useState("");
  const [emoji, setEmoji] = useState("");
  const [target, setTarget] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New tracker</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Name (e.g. Meditate)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              className="w-20"
              placeholder="Emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            />
            <Input
              placeholder="Category (Life, Business, Skills…)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="check">Check (did it — tap ✓)</SelectItem>
              <SelectItem value="count">
                Count (tap +1, e.g. glasses)
              </SelectItem>
              <SelectItem value="scale">Scale (1–5, e.g. mood)</SelectItem>
              <SelectItem value="note">Note (journal)</SelectItem>
            </SelectContent>
          </Select>
          {kind === "count" && (
            <Input
              placeholder="Unit (glasses, min, $…)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          )}
          {kind !== "note" && (
            <Input
              type="number"
              min={1}
              placeholder={
                kind === "count"
                  ? "Daily goal (optional, e.g. 8)"
                  : "Daily goal (optional, e.g. 1)"
              }
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                name.trim() &&
                onAdded({
                  name: name.trim(),
                  category: category.trim() || "Life",
                  kind,
                  unit: unit.trim() || null,
                  emoji: emoji.trim(),
                  target: target && Number(target) > 0 ? Number(target) : null,
                })
              }
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
