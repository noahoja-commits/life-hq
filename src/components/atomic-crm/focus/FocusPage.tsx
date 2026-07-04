import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useGetList, useGetIdentity, useCreate, useNotify } from "ra-core";
import { Brain, Play, Square, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FocusSession {
  id: number;
  label?: string | null;
  planned_minutes: number;
  actual_minutes?: number | null;
  started_at: string;
  completed: boolean;
}

const PRESETS = [15, 25, 50];
const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export const FocusPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data: sessions, refetch } = useGetList<FocusSession>("focus_sessions", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "started_at", order: "DESC" },
  });

  const [searchParams] = useSearchParams();
  const [label, setLabel] = useState("");
  const [planned, setPlanned] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const startedRef = useRef<string | null>(null);
  const endRef = useRef<number>(0); // target end timestamp (ms) — drift-proof
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prefill the label when arriving from "Do this next → Focus".
  useEffect(() => {
    const l = searchParams.get("label");
    if (l) setLabel(l);
  }, [searchParams]);

  // keep display in sync with the selected preset while idle
  useEffect(() => {
    if (!running) setLeft(planned * 60);
  }, [planned, running]);

  const log = (actualMinutes: number, completed: boolean) => {
    create(
      "focus_sessions",
      {
        data: {
          sales_id: salesId,
          label: label.trim() || null,
          planned_minutes: planned,
          actual_minutes: actualMinutes,
          completed,
          started_at: startedRef.current ?? new Date().toISOString(),
        },
      },
      { onSuccess: () => refetch() },
    );
  };

  const stopTick = () => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  };

  const start = () => {
    startedRef.current = new Date().toISOString();
    endRef.current = Date.now() + planned * 60 * 1000;
    setRunning(true);
    setLeft(planned * 60);
    stopTick();
    // Compute remaining from the target timestamp so the timer stays accurate
    // even when the PWA tab is backgrounded and setInterval is throttled.
    tick.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        stopTick();
        setRunning(false);
        log(planned, true);
        notify("Focus session complete 🎯", { type: "info" });
        setLeft(planned * 60);
      }
    }, 250);
  };

  const stop = () => {
    stopTick();
    const elapsed = Math.max(1, Math.round((planned * 60 - left) / 60));
    if (left < planned * 60) log(elapsed, false);
    setRunning(false);
    setLeft(planned * 60);
  };

  const reset = () => {
    stopTick();
    setRunning(false);
    setLeft(planned * 60);
  };

  useEffect(() => () => stopTick(), []);

  const todayMinutes = (sessions ?? [])
    .filter((s) => isToday(s.started_at))
    .reduce((sum, s) => sum + (s.actual_minutes ?? 0), 0);

  const progress = 1 - left / (planned * 60);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Focus</h1>
      </div>

      <Card className="p-8 flex flex-col items-center gap-6">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={running}
          placeholder="What are you focusing on?"
          className="text-center border-0 shadow-none focus-visible:ring-0 text-lg"
        />

        {/* Timer */}
        <div className="relative flex items-center justify-center">
          <svg className="size-56 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--muted)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span className="absolute text-5xl font-semibold tabular-nums">{fmt(left)}</span>
        </div>

        {!running && (
          <div className="flex gap-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => setPlanned(m)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm border transition-colors",
                  planned === m ? "bg-primary/15 text-primary border-primary/30" : "hover:bg-accent",
                )}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {!running ? (
            <Button onClick={start} className="gap-1 rounded-full px-6">
              <Play className="size-4" /> Start
            </Button>
          ) : (
            <Button onClick={stop} variant="secondary" className="gap-1 rounded-full px-6">
              <Square className="size-4" /> Stop
            </Button>
          )}
          <Button onClick={reset} variant="ghost" size="icon" className="rounded-full" aria-label="Reset">
            <RotateCcw className="size-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {todayMinutes > 0 ? `${todayMinutes} min focused today 🔥` : "First focus of the day?"}
        </p>
      </Card>

      {sessions && sessions.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Recent sessions
          </h2>
          <Card className="divide-y p-0">
            {sessions.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <Brain className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{s.label || "Focus session"}</span>
                <span className="text-muted-foreground">
                  {s.actual_minutes ?? s.planned_minutes}m{s.completed ? " ✓" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
};

FocusPage.path = "/focus";
