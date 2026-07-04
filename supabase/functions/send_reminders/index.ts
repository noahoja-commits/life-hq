import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(
  SUPABASE_URL,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:noahoja07@gmail.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const REMINDER_SECRET = Deno.env.get("REMINDER_SECRET");
const ACTION_SECRET = Deno.env.get("REMINDER_ACTION_SECRET") || "";
const ACTION_BASE = `${SUPABASE_URL}/functions/v1/reminder_action`;

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Signed, expiring token authorizing one action. Extra fields (tz, td, tm)
// let reminder_action do timezone-correct snoozes/rollovers statelessly.
async function signAction(payload: Record<string, unknown>): Promise<string> {
  const body = { exp: Date.now() + 3 * 24 * 60 * 60 * 1000, ...payload };
  const payloadB64 = b64url(new TextEncoder().encode(JSON.stringify(body)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ACTION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  return `${payloadB64}.${b64url(new Uint8Array(sig))}`;
}

type Sub = { id: number; sales_id: number | null; subscription: unknown; tz?: string | null };

async function sendToSubs(subs: Sub[], payload: string) {
  let sent = 0;
  let removed = 0;
  for (const sub of subs) {
    try {
      // deno-lint-ignore no-explicit-any
      await webpush.sendNotification(sub.subscription as any, payload);
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        removed++;
      }
    }
  }
  return { sent, removed };
}

// ── Timezone helpers (per-device IANA tz from push_subscriptions.tz) ───────
const localDateIn = (tz: string, d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d); // YYYY-MM-DD
const localHMIn = (tz: string, d = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d); // HH:MM
const localWeekdayIn = (tz: string, d = new Date()) =>
  new Date(d.toLocaleString("en-US", { timeZone: tz })).getDay(); // 0=Sun
const minutesOf = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
const tomorrowDateIn = (tz: string) => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return localDateIn(tz, d);
};

// Next occurrence of a bill's due day relative to a local YYYY-MM-DD "today"
// (clamped to month length), plus whole days until it.
const pad2 = (n: number) => String(n).padStart(2, "0");
const billNextDue = (dueDay: number, today: string): string => {
  const [y, m] = today.split("-").map(Number);
  const mk = (yy: number, mm: number) => {
    const last = new Date(yy, mm, 0).getDate(); // mm is 1-based here
    return `${yy}-${pad2(mm)}-${pad2(Math.min(dueDay, last))}`;
  };
  const thisMonth = mk(y, m);
  if (thisMonth >= today) return thisMonth;
  return m === 12 ? mk(y + 1, 1) : mk(y, m + 1);
};
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);

// Fire a daily nudge when local time passed remind_time within the last 3h
// (prevents a just-set evening time from instantly firing a morning nudge).
// Wraps midnight so a 23:30 nudge caught by an 00:15 sweep still fires.
const inFireWindow = (nowHM: string, remindTime: string) => {
  const diff = (minutesOf(nowHM) - minutesOf(remindTime.slice(0, 5)) + 1440) % 1440;
  return diff <= 180;
};
// When the window wrapped past midnight, the nudge belongs to YESTERDAY's
// local date (for dedup), not the sweep's.
const nudgeClaimDay = (tz: string, nowHM: string, remindTime: string) =>
  minutesOf(nowHM) < minutesOf(remindTime.slice(0, 5))
    ? localDateIn(tz, new Date(Date.now() - 24 * 60 * 60 * 1000))
    : localDateIn(tz);

/** Race-safe once-per-occurrence ledger: true if WE claimed it. */
async function claim(
  salesId: number,
  refTable: string,
  refId: number,
  occurrenceKey: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("notifications_log")
    .upsert(
      { sales_id: salesId, ref_table: refTable, ref_id: refId, occurrence_key: occurrenceKey },
      { onConflict: "sales_id,ref_table,ref_id,occurrence_key", ignoreDuplicates: true },
    )
    .select("id");
  return !!data && data.length > 0;
}

// ── Per-item timed reminders + daily nudges + evening wrap-up ──────────────
async function runTimed() {
  const nowIso = new Date().toISOString();
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  const subsBySales = new Map<number, Sub[]>();
  for (const s of (subs ?? []) as Sub[]) {
    if (s.sales_id == null) continue;
    const arr = subsBySales.get(s.sales_id) ?? [];
    arr.push(s);
    subsBySales.set(s.sales_id, arr);
  }

  let fired = 0;
  let sent = 0;
  let removed = 0;
  const bump = (r: { sent: number; removed: number }) => {
    sent += r.sent;
    removed += r.removed;
  };

  // 1) Exact-time to-do reminders (absolute timestamptz — tz-independent).
  const { data: due } = await supabase
    .from("todos")
    .select("id, sales_id, text, remind_at")
    .eq("done", false)
    .not("remind_at", "is", null)
    .lte("remind_at", nowIso)
    .limit(200);

  for (const todo of due ?? []) {
    if (todo.sales_id == null) continue;
    const targetSubs = subsBySales.get(todo.sales_id) ?? [];
    if (targetSubs.length === 0) continue;
    if (!(await claim(todo.sales_id, "todos", todo.id, String(todo.remind_at)))) continue;
    fired++;

    const tz = targetSubs.find((s) => s.tz)?.tz ?? "UTC";
    const doneTok = await signAction({ t: "todos", id: todo.id, sid: todo.sales_id, act: "done" });
    const snoozeTok = await signAction({ t: "todos", id: todo.id, sid: todo.sales_id, act: "snooze", tz });
    bump(
      await sendToSubs(
        targetSubs,
        JSON.stringify({
          title: "⏰ Reminder",
          body: todo.text,
          tag: `todo-${todo.id}`,
          url: "/#/todos",
          requireInteraction: true,
          actions: [
            { action: "done", title: "✓ Done" },
            { action: "snooze", title: "⏰ Later" },
          ],
          doneUrl: `${ACTION_BASE}?tok=${doneTok}`,
          snoozeUrl: `${ACTION_BASE}?tok=${snoozeTok}`,
        }),
      ),
    );
  }

  // 2-4) Per-user local-time work: routine nudges, tracker nudges, wrap-up.
  const { data: routines } = await supabase
    .from("routines")
    .select("id, sales_id, name, emoji, remind_time, active_days")
    .not("remind_time", "is", null);
  const { data: trackers } = await supabase
    .from("trackers")
    .select("id, sales_id, name, emoji, remind_time")
    .not("remind_time", "is", null);
  const { data: allBills } = await supabase
    .from("bills")
    .select("id, sales_id, name, amount, due_day, autopay, active, last_paid_on")
    .eq("active", true)
    .eq("autopay", false);
  const { data: allDates } = await supabase
    .from("life_dates")
    .select("id, sales_id, title, emoji, on_date, repeat_yearly, remind_days_before");

  // Next occurrence of a life date relative to local "today".
  // Feb-29 anniversaries fall back to Feb 28 in non-leap years.
  const safeDate = (s: string) =>
    Number.isNaN(new Date(s + "T00:00:00Z").getTime()) ? s.replace("-02-29", "-02-28") : s;
  const dateNextOccurrence = (d: { on_date: string; repeat_yearly: boolean }, today: string) => {
    if (!d.repeat_yearly) return d.on_date;
    const [, m, day] = d.on_date.split("-");
    const thisYear = safeDate(`${today.slice(0, 4)}-${m}-${day}`);
    return thisYear >= today ? thisYear : safeDate(`${Number(today.slice(0, 4)) + 1}-${m}-${day}`);
  };

  for (const [salesId, userSubs] of subsBySales) {
    const tz = userSubs.find((s) => s.tz)?.tz;
    if (!tz) continue; // no timezone known yet — client sets it on next open
    const today = localDateIn(tz);
    const nowHM = localHMIn(tz);
    const dow = localWeekdayIn(tz);

    // Routine nudges: due time passed, active today, not fully checked today.
    for (const r of routines ?? []) {
      if (r.sales_id !== salesId) continue;
      if (r.active_days && r.active_days.length > 0 && !r.active_days.includes(dow)) continue;
      if (!inFireWindow(nowHM, String(r.remind_time))) continue;

      const { data: steps } = await supabase
        .from("routine_steps")
        .select("id")
        .eq("routine_id", r.id);
      const stepIds = (steps ?? []).map((s) => s.id);
      if (stepIds.length === 0) continue;
      const { count: checked } = await supabase
        .from("routine_checks")
        .select("id", { count: "exact", head: true })
        .in("step_id", stepIds)
        .eq("checked_on", today);
      if ((checked ?? 0) >= stepIds.length) continue; // already done today

      if (!(await claim(salesId, "routines", r.id, nudgeClaimDay(tz, nowHM, String(r.remind_time))))) continue;
      fired++;
      bump(
        await sendToSubs(
          userSubs,
          JSON.stringify({
            title: `${r.emoji ?? "🔁"} ${r.name}`,
            body: "Whenever you're ready — check off what you get to.",
            tag: `routine-${r.id}`,
            url: "/#/routines",
          }),
        ),
      );
    }

    // Tracker nudges: due time passed, nothing logged today.
    for (const t of trackers ?? []) {
      if (t.sales_id !== salesId) continue;
      if (!inFireWindow(nowHM, String(t.remind_time))) continue;

      const dayStartUtc = new Date(`${today}T00:00:00`);
      // Approximate local-day start using tz offset via Intl round-trip.
      const offsetMs =
        new Date(new Date().toLocaleString("en-US", { timeZone: tz })).getTime() -
        Date.now();
      const startIso = new Date(dayStartUtc.getTime() - offsetMs).toISOString();
      const { count: logged } = await supabase
        .from("log_entries")
        .select("id", { count: "exact", head: true })
        .eq("tracker_id", t.id)
        .gte("logged_at", startIso);
      if ((logged ?? 0) > 0) continue;

      if (!(await claim(salesId, "trackers", t.id, nudgeClaimDay(tz, nowHM, String(t.remind_time))))) continue;
      fired++;
      bump(
        await sendToSubs(
          userSubs,
          JSON.stringify({
            title: `${t.emoji ?? "📊"} ${t.name}`,
            body: "Quick log? Takes two seconds.",
            tag: `tracker-${t.id}`,
            url: "/#/track",
          }),
        ),
      );
    }

    // Bill reminders: once at T-2 days and once on the due day, mornings
    // (first sweep after 9am local). Autopay and already-paid skip.
    if (nowHM >= "09:00") {
      for (const b of allBills ?? []) {
        if (b.sales_id !== salesId) continue;
        if (b.last_paid_on && String(b.last_paid_on).startsWith(today.slice(0, 7))) continue;
        const due = billNextDue(b.due_day, today);
        const days = daysBetween(today, due);
        if (days !== 2 && days !== 0) continue;
        const occ = `${due}-${days === 0 ? "due" : "pre"}`;
        if (!(await claim(salesId, "bills", b.id, occ))) continue;
        fired++;
        bump(
          await sendToSubs(
            userSubs,
            JSON.stringify({
              title: `💵 ${b.name}`,
              body:
                days === 0
                  ? `$${Number(b.amount)} due today.`
                  : `$${Number(b.amount)} due in 2 days (${due}).`,
              tag: `bill-${b.id}`,
              url: "/#/money",
            }),
          ),
        );
      }
    }

    // Important-date reminders: heads-up N days before + day-of, mornings.
    if (nowHM >= "09:00") {
      for (const d of allDates ?? []) {
        if (d.sales_id !== salesId) continue;
        const next = dateNextOccurrence(d, today);
        const days = daysBetween(today, next);
        const isHeadsUp = days === Number(d.remind_days_before) && days > 0;
        const isDayOf = days === 0;
        if (!isHeadsUp && !isDayOf) continue;
        const occ = `${next}-${isDayOf ? "day" : "pre"}`;
        if (!(await claim(salesId, "life_dates", d.id, occ))) continue;
        fired++;
        bump(
          await sendToSubs(
            userSubs,
            JSON.stringify({
              title: `${d.emoji || "📅"} ${d.title}`,
              body: isDayOf ? "It's today!" : `Coming up in ${days} day${days > 1 ? "s" : ""} (${next}).`,
              tag: `date-${d.id}`,
              url: "/#/dates",
            }),
          ),
        );
      }
    }

    // Evening wrap-up (local 20:00–20:59): what's left + one-tap roll-forward.
    if (nowHM >= "20:00" && nowHM < "21:00") {
      const { count: left } = await supabase
        .from("todos")
        .select("id", { count: "exact", head: true })
        .eq("sales_id", salesId)
        .eq("done", false)
        .lte("due_date", today);
      if ((left ?? 0) > 0 && (await claim(salesId, "wrapup", 0, today))) {
        fired++;
        const tomorrow = tomorrowDateIn(tz);
        const rolloverTok = await signAction({
          t: "todos",
          id: 0,
          sid: salesId,
          act: "rollover",
          td: today,
          tm: tomorrow,
        });
        bump(
          await sendToSubs(
            userSubs,
            JSON.stringify({
              title: "🌙 Wrapping up",
              body: `${left} left from today — tomorrow is fine too.`,
              tag: "wrapup",
              url: "/#/todos",
              actions: [{ action: "snooze", title: "→ Tomorrow" }],
              snoozeUrl: `${ACTION_BASE}?tok=${rolloverTok}`,
            }),
          ),
        );
      }
    }
  }

  return { mode: "timed", fired, sent, removed };
}

// ── Morning digest (one warm summary) ───────────────────────────────────────
async function runDigest() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*");
  if (error) throw error;

  let sent = 0;
  let removed = 0;

  for (const sub of (subs ?? []) as Sub[]) {
    let dueTodos = 0;
    let dueProjects = 0;
    let dueFollowUps = 0;
    let dueBills = 0;
    if (sub.sales_id) {
      const { count: t } = await supabase
        .from("todos")
        .select("id", { count: "exact", head: true })
        .eq("sales_id", sub.sales_id)
        .eq("done", false)
        .lte("due_date", today);
      dueTodos = t ?? 0;
      const { count: p } = await supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("sales_id", sub.sales_id)
        .not("expected_closing_date", "is", null)
        .lte("expected_closing_date", today)
        .in("stage", ["someday", "soon", "active"]);
      dueProjects = p ?? 0;
      const { count: f } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("sales_id", sub.sales_id)
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", today)
        .not("status", "in", "(closed,offer)");
      dueFollowUps = f ?? 0;
      const { data: userBills } = await supabase
        .from("bills")
        .select("due_day, autopay, active, last_paid_on")
        .eq("sales_id", sub.sales_id)
        .eq("active", true)
        .eq("autopay", false);
      dueBills = (userBills ?? []).filter((b) => {
        if (b.last_paid_on && String(b.last_paid_on).startsWith(today.slice(0, 7))) return false;
        return daysBetween(today, billNextDue(b.due_day, today)) <= 3;
      }).length;
    }

    const parts: string[] = [];
    if (dueTodos > 0) parts.push(`${dueTodos} to-do${dueTodos > 1 ? "s" : ""}`);
    if (dueProjects > 0)
      parts.push(`${dueProjects} project${dueProjects > 1 ? "s" : ""}`);
    if (dueFollowUps > 0)
      parts.push(`${dueFollowUps} job follow-up${dueFollowUps > 1 ? "s" : ""}`);
    if (dueBills > 0)
      parts.push(`${dueBills} bill${dueBills > 1 ? "s" : ""} due soon`);

    const body =
      parts.length > 0
        ? `☀️ Good morning — ${parts.join(" + ")} today.`
        : "☀️ Good morning from Life HQ — nothing due today. Enjoy the clear deck.";

    const payload = JSON.stringify({
      title: "Life HQ",
      body,
      url:
        dueFollowUps > 0 && dueTodos === 0
          ? "/#/applications"
          : dueTodos > 0
            ? "/#/todos"
            : "/",
      tag: "daily-digest",
    });
    const r = await sendToSubs([sub], payload);
    sent += r.sent;
    removed += r.removed;
  }

  return { mode: "digest", subscriptions: subs?.length ?? 0, sent, removed };
}

Deno.serve(async (req) => {
  if (
    !REMINDER_SECRET ||
    req.headers.get("x-reminder-secret") !== REMINDER_SECRET
  ) {
    return new Response("unauthorized", { status: 401 });
  }

  let mode = "timed";
  try {
    const body = await req.json();
    if (body?.mode) mode = String(body.mode);
  } catch {
    // no body → default timed
  }

  try {
    const result = mode === "digest" ? await runDigest() : await runTimed();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
