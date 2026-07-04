import { useState } from "react";
import { useGetList, useGetIdentity, useCreate, useDelete } from "ra-core";
import { Phone, Trash2, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

export interface CallLogEntry {
  id: number;
  application_id?: number | null;
  who?: string;
  outcome: string;
  note?: string;
  called_at: string;
}

export const CALL_OUTCOMES: { key: string; label: string; tone: string }[] = [
  { key: "no_answer", label: "No answer", tone: "text-muted-foreground" },
  { key: "voicemail", label: "Voicemail", tone: "text-sky-400" },
  { key: "gatekeeper", label: "Gatekeeper", tone: "text-amber-400" },
  { key: "talked", label: "Talked!", tone: "text-green-500" },
  { key: "interview", label: "Interview!", tone: "text-fuchsia-400" },
];

export const outcomeMeta = (key: string) =>
  CALL_OUTCOMES.find((o) => o.key === key) ?? CALL_OUTCOMES[0];

const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();

/**
 * Cold-call courage counter: one tap per dial. Counts, never streaks —
 * every dial is a rep regardless of outcome.
 */
export const CallLogSection = () => {
  const { identity } = useGetIdentity();
  const haptic = useHaptics();
  const [create] = useCreate();
  const [remove] = useDelete();
  const [who, setWho] = useState("");
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data } = useGetList<CallLogEntry>("call_logs", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "called_at", order: "DESC" },
  });
  const calls = data ?? [];
  const today = calls.filter((c) => isToday(c.called_at));

  const log = (outcome: string) => {
    haptic(outcome === "talked" || outcome === "interview" ? "success" : "tick");
    create("call_logs", {
      data: { outcome, who: who.trim(), sales_id: salesId },
    });
    setWho("");
  };

  return (
    <Card className="p-4 mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Phone className="size-4 text-primary" />
        <h2 className="text-sm font-medium flex-1">
          Calls today:{" "}
          <span className="text-primary font-semibold tabular-nums">{today.length}</span>
          <span className="text-xs text-muted-foreground ml-2">
            every dial counts, whatever happens
          </span>
        </h2>
        {today.some((c) => c.outcome === "interview") && (
          <PartyPopper className="size-4 text-fuchsia-400" />
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          value={who}
          onChange={(e) => setWho(e.target.value)}
          placeholder="Who? (optional)"
          className="h-8 w-40 text-sm"
        />
        {CALL_OUTCOMES.map((o) => (
          <button
            key={o.key}
            onClick={() => log(o.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-all active:scale-95 hover:bg-accent",
              o.tone,
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {calls.length > 0 && (
        <div className="flex flex-col divide-y text-sm border-t pt-1">
          {calls.slice(0, 6).map((c) => (
            <div key={c.id} className="group flex items-center gap-2 py-1.5">
              <span className={cn("text-xs w-20 shrink-0", outcomeMeta(c.outcome).tone)}>
                {outcomeMeta(c.outcome).label}
              </span>
              <span className="flex-1 truncate text-muted-foreground">{c.who || "—"}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(c.called_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                {new Date(c.called_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </span>
              <button
                onClick={() =>
                  remove("call_logs", { id: c.id, previousData: c }, { mutationMode: "optimistic" })
                }
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                aria-label="Delete call log"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/** Per-application one-tap call logging (inside the expanded card). */
export const LogCallChips = ({
  applicationId,
  company,
}: {
  applicationId: number;
  company: string;
}) => {
  const { identity } = useGetIdentity();
  const haptic = useHaptics();
  const [create] = useCreate();
  const salesId = identity?.id ? Number(identity.id) : null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground flex items-center gap-1">
        <Phone className="size-3" /> Log call
      </span>
      {CALL_OUTCOMES.map((o) => (
        <button
          key={o.key}
          onClick={() => {
            haptic(o.key === "talked" || o.key === "interview" ? "success" : "tick");
            create("call_logs", {
              data: { outcome: o.key, who: company, application_id: applicationId, sales_id: salesId },
            });
          }}
          className={cn("rounded-full border px-2 py-0.5 transition-all active:scale-95 hover:bg-accent", o.tone)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};
