// Client-side recurrence: when a repeating to-do is completed, we compute the
// NEXT occurrence and create it. Completion-based (GTD style) so a missed item
// never piles up into a stack of overdue copies — exactly one open instance.

export type RecurFreq = "daily" | "weekly" | "monthly";

export interface RecurringFields {
  due_date?: string | null;
  remind_at?: string | null;
  recur_freq?: RecurFreq | null;
  recur_byweekday?: number[] | null; // 0=Sun..6=Sat
  recur_day_of_month?: number | null;
  recur_until?: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Compute the next due date string (YYYY-MM-DD) strictly after `base`,
 * or null if the rule has ended. `base` defaults to today.
 */
export function nextDueDate(
  rule: RecurringFields,
  base: Date = new Date(),
): string | null {
  const freq = rule.recur_freq;
  if (!freq) return null;
  // Anchor from the existing due date if present, else today — floored at
  // today so completing an overdue recurring item never recreates an
  // already-overdue instance (no pile-up).
  const todayD = new Date(base);
  todayD.setHours(0, 0, 0, 0);
  let anchor = rule.due_date ? parseISODate(rule.due_date) : new Date(base);
  anchor.setHours(0, 0, 0, 0);
  if (anchor < todayD) anchor = todayD;

  let next: Date | null = null;

  if (freq === "daily") {
    next = new Date(anchor);
    next.setDate(next.getDate() + 1);
  } else if (freq === "weekly") {
    const days =
      rule.recur_byweekday && rule.recur_byweekday.length > 0
        ? [...rule.recur_byweekday].sort((a, b) => a - b)
        : [anchor.getDay()];
    // Find the next weekday in the set after `anchor`.
    for (let add = 1; add <= 7; add++) {
      const cand = new Date(anchor);
      cand.setDate(cand.getDate() + add);
      if (days.includes(cand.getDay())) {
        next = cand;
        break;
      }
    }
  } else if (freq === "monthly") {
    const dom = rule.recur_day_of_month || anchor.getDate();
    next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    // Clamp to the month's last day (e.g. day 31 in a 30-day month).
    const lastDay = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0,
    ).getDate();
    next.setDate(Math.min(dom, lastDay));
  }

  if (!next) return null;
  if (rule.recur_until) {
    const until = parseISODate(rule.recur_until);
    if (next > until) return null;
  }
  return toISODate(next);
}

/**
 * Given a completed recurring to-do, return the field patch for the NEXT
 * instance (same time-of-day for remind_at), or null if the series has ended.
 */
export function nextOccurrenceFields(
  rule: RecurringFields,
): { due_date: string; remind_at: string | null } | null {
  const due = nextDueDate(rule);
  if (!due) return null;

  let remind_at: string | null = null;
  if (rule.remind_at) {
    // Keep the same clock time, move it onto the new due date.
    const prev = new Date(rule.remind_at);
    const [y, m, d] = due.split("-").map(Number);
    const nd = new Date(
      y,
      m - 1,
      d,
      prev.getHours(),
      prev.getMinutes(),
      0,
      0,
    );
    remind_at = nd.toISOString();
  }
  return { due_date: due, remind_at };
}

/**
 * Shared "complete a possibly-recurring todo" helper: returns the insert
 * payload for the NEXT instance, or null (not recurring / series ended /
 * an open sibling already exists). Used by every completion path so a
 * recurring item never dies from being completed in the "wrong" place.
 */
export function nextInstancePayload(
  t: RecurringFields & {
    id: number;
    text: string;
    notes?: string | null;
    priority: number;
    position?: number;
    project_id?: number | null;
    venture_id?: number | null;
    application_id?: number | null;
  },
  salesId: number | null,
  allTodos: { id: number; text: string; done: boolean; recur_freq?: string | null }[],
): Record<string, unknown> | null {
  if (!t.recur_freq) return null;
  const hasOpenSibling = allTodos.some(
    (o) => !o.done && o.id !== t.id && o.text === t.text && o.recur_freq === t.recur_freq,
  );
  if (hasOpenSibling) return null;
  const next = nextOccurrenceFields(t);
  if (!next) return null;
  return {
    text: t.text,
    notes: t.notes ?? null,
    priority: t.priority,
    due_date: next.due_date,
    remind_at: next.remind_at,
    recur_freq: t.recur_freq,
    recur_byweekday: t.recur_byweekday ?? null,
    recur_day_of_month: t.recur_day_of_month ?? null,
    recur_until: t.recur_until ?? null,
    project_id: t.project_id ?? null,
    venture_id: t.venture_id ?? null,
    application_id: t.application_id ?? null,
    sales_id: salesId,
    position: t.position ?? 0,
  };
}

export const recurLabel = (rule: RecurringFields): string | null => {
  if (!rule.recur_freq) return null;
  if (rule.recur_freq === "daily") return "Daily";
  if (rule.recur_freq === "monthly") return "Monthly";
  if (rule.recur_freq === "weekly") {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (rule.recur_byweekday && rule.recur_byweekday.length > 0 && rule.recur_byweekday.length < 7) {
      return "Weekly · " + [...rule.recur_byweekday].sort((a, b) => a - b).map((d) => names[d]).join(" ");
    }
    return "Weekly";
  }
  return null;
};
