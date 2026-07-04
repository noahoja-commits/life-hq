// Handles Done / Snooze taps from a push notification's action buttons.
// Called by the service worker WITHOUT a user JWT — authorization comes from a
// short-lived, HMAC-signed, action-bound token minted by send_reminders.
// Deploy with --no-verify-jwt. Least-privilege: a valid token can only complete
// or snooze the ONE todo it names, scoped to that token's sales_id.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const ACTION_SECRET = Deno.env.get("REMINDER_ACTION_SECRET") || "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const fromB64url = (s: string): Uint8Array => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob(b64 + pad);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
};
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

interface TokenPayload {
  t: string;
  id: number;
  sid: number;
  act: "done" | "snooze" | "rollover";
  exp: number;
  /** IANA timezone (snooze) — enables "tomorrow 9am local". */
  tz?: string;
  /** Local today / tomorrow dates (rollover), computed at mint time. */
  td?: string;
  tm?: string;
}

async function verify(tok: string): Promise<TokenPayload | null> {
  const dot = tok.lastIndexOf(".");
  if (dot < 0) return null;
  const payloadB64 = tok.slice(0, dot);
  const sigB64 = tok.slice(dot + 1);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ACTION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    fromB64url(sigB64),
    new TextEncoder().encode(payloadB64),
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromB64url(payloadB64)),
    ) as TokenPayload;
    if (payload.t !== "todos") return null;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Server-side recurrence (port of the client's completion-based rule,
// floored at today so overdue completions never recreate past instances) ────
interface RecurTodo {
  due_date?: string | null;
  remind_at?: string | null;
  recur_freq?: string | null;
  recur_byweekday?: number[] | null;
  recur_day_of_month?: number | null;
  recur_until?: string | null;
}

const padN = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${padN(d.getUTCMonth() + 1)}-${padN(d.getUTCDate())}`;

function nextRecurrence(t: RecurTodo): { due_date: string; remind_at: string | null } | null {
  if (!t.recur_freq) return null;
  const todayD = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  let anchor = t.due_date ? new Date(t.due_date + "T00:00:00Z") : todayD;
  if (anchor < todayD) anchor = todayD;

  let next: Date | null = null;
  if (t.recur_freq === "daily") {
    next = new Date(anchor.getTime() + 86400000);
  } else if (t.recur_freq === "weekly") {
    const days =
      t.recur_byweekday && t.recur_byweekday.length > 0
        ? [...t.recur_byweekday].sort((a, b) => a - b)
        : [anchor.getUTCDay()];
    for (let add = 1; add <= 7; add++) {
      const cand = new Date(anchor.getTime() + add * 86400000);
      if (days.includes(cand.getUTCDay())) {
        next = cand;
        break;
      }
    }
  } else if (t.recur_freq === "monthly") {
    const dom = t.recur_day_of_month || anchor.getUTCDate();
    const y = anchor.getUTCFullYear();
    const m = anchor.getUTCMonth();
    const lastDay = new Date(Date.UTC(y, m + 2, 0)).getUTCDate();
    next = new Date(Date.UTC(y, m + 1, Math.min(dom, lastDay)));
  }
  if (!next) return null;
  if (t.recur_until && isoOf(next) > t.recur_until) return null;

  let remind_at: string | null = null;
  if (t.remind_at) {
    const prev = new Date(t.remind_at);
    const nd = new Date(next);
    nd.setUTCHours(prev.getUTCHours(), prev.getUTCMinutes(), 0, 0);
    remind_at = nd.toISOString();
  }
  return { due_date: isoOf(next), remind_at };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!ACTION_SECRET) {
    return new Response("not configured", { status: 503, headers: CORS });
  }

  const url = new URL(req.url);
  const tok = url.searchParams.get("tok") ?? "";
  const payload = await verify(tok);
  if (!payload) {
    return new Response("invalid or expired", { status: 401, headers: CORS });
  }

  let snoozedToMorning = false;
  try {
    if (payload.act === "done") {
      // Grab recurrence fields BEFORE completing, so a recurring item done
      // from the notification still spawns its next instance.
      const { data: todo } = await supabase
        .from("todos")
        .select(
          "id, text, notes, priority, position, due_date, remind_at, recur_freq, recur_byweekday, recur_day_of_month, recur_until, project_id, venture_id, application_id",
        )
        .eq("id", payload.id)
        .eq("sales_id", payload.sid)
        .maybeSingle();

      await supabase
        .from("todos")
        .update({ done: true, done_at: new Date().toISOString() })
        .eq("id", payload.id)
        .eq("sales_id", payload.sid);

      if (todo?.recur_freq) {
        const next = nextRecurrence(todo);
        if (next) {
          // One open instance per series: skip if a sibling is already open.
          const { count } = await supabase
            .from("todos")
            .select("id", { count: "exact", head: true })
            .eq("sales_id", payload.sid)
            .eq("done", false)
            .eq("text", todo.text)
            .eq("recur_freq", todo.recur_freq)
            .neq("id", todo.id);
          if ((count ?? 0) === 0) {
            await supabase.from("todos").insert({
              text: todo.text,
              notes: todo.notes,
              priority: todo.priority,
              position: todo.position ?? 0,
              due_date: next.due_date,
              remind_at: next.remind_at,
              recur_freq: todo.recur_freq,
              recur_byweekday: todo.recur_byweekday,
              recur_day_of_month: todo.recur_day_of_month,
              recur_until: todo.recur_until,
              project_id: todo.project_id,
              venture_id: todo.venture_id,
              application_id: todo.application_id,
              sales_id: payload.sid,
            });
          }
        }
      }
    } else if (payload.act === "snooze") {
      // Smart snooze: +1h during the day; after 6pm local, tomorrow 9am local.
      let next = new Date(Date.now() + 60 * 60 * 1000);
      if (payload.tz) {
        try {
          const localNow = new Date(
            new Date().toLocaleString("en-US", { timeZone: payload.tz }),
          );
          if (localNow.getHours() >= 18) {
            const offsetMs = localNow.getTime() - Date.now();
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const localDate = new Intl.DateTimeFormat("en-CA", {
              timeZone: payload.tz,
            }).format(tomorrow);
            next = new Date(
              new Date(`${localDate}T09:00:00Z`).getTime() - offsetMs,
            );
            snoozedToMorning = true;
          }
        } catch {
          // bad tz — keep +1h
        }
      }
      // Only snooze if still open; new remind_at = new occurrence → re-fires.
      await supabase
        .from("todos")
        .update({ remind_at: next.toISOString() })
        .eq("id", payload.id)
        .eq("sales_id", payload.sid)
        .eq("done", false);
    } else if (payload.act === "rollover") {
      // Evening wrap-up "→ Tomorrow": move everything still due today (or
      // overdue) to tomorrow, scoped to the token's user.
      if (!payload.td || !payload.tm) {
        return new Response("bad token", { status: 400, headers: CORS });
      }
      await supabase
        .from("todos")
        .update({ due_date: payload.tm })
        .eq("sales_id", payload.sid)
        .eq("done", false)
        .lte("due_date", payload.td);
    }
  } catch {
    return new Response("error", { status: 500, headers: CORS });
  }

  const msg =
    payload.act === "done"
      ? "Marked done ✓ — you can close this."
      : payload.act === "rollover"
        ? "Moved to tomorrow 🌙 — sleep easy."
        : snoozedToMorning
          ? "Snoozed until tomorrow morning ⏰"
          : "Snoozed 1 hour ⏰ — you can close this.";
  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0b0b12;color:#e8e8f0"><div style="text-align:center"><div style="font-size:40px">${payload.act === "done" ? "✓" : "⏰"}</div><p>${msg}</p></div></body>`,
    { headers: { ...CORS, "Content-Type": "text/html" } },
  );
});
