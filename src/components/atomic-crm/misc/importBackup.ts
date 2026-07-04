import { getSupabaseClient } from "../providers/supabase/supabase";

// Restore a life-hq-backup-*.json (produced by exportData.ts) into the
// current account. ADDITIVE: inserts everything as new rows (fresh ids,
// owned by the current user) — never overwrites or deletes existing data.
// CRM-legacy entities (contacts/companies/deals/notes/tags/tasks) are NOT
// restored here — they have triggers/views/avatars and their own importer.

type Row = Record<string, unknown>;

interface TableSpec {
  name: string;
  /** Columns to copy verbatim (missing ones are ignored). */
  columns: string[];
  /** FK columns remapped through a parent's old->new id map. */
  remap?: { column: string; parent: string }[];
}

// Dependency order: parents before children.
const TABLES: TableSpec[] = [
  {
    name: "trackers",
    columns: ["name", "category", "kind", "unit", "color", "emoji", "position", "active", "target", "created_at"],
  },
  {
    name: "lists",
    columns: ["name", "emoji", "color", "position", "created_at"],
  },
  {
    name: "routines",
    columns: ["name", "emoji", "color", "position", "active_days", "created_at"],
  },
  {
    name: "ventures",
    columns: ["name", "emoji", "color", "status", "description", "url", "next_action", "position", "created_at"],
  },
  {
    name: "applications",
    columns: ["company", "role", "url", "status", "location", "salary", "follow_up_date", "notes", "position", "created_at"],
  },
  {
    name: "hub_items",
    columns: ["title", "url", "category", "kind", "description", "color", "position", "created_at"],
  },
  {
    name: "focus_sessions",
    columns: ["label", "planned_minutes", "actual_minutes", "started_at", "completed", "created_at"],
  },
  {
    name: "list_items",
    columns: ["text", "checked", "position", "created_at"],
    remap: [{ column: "list_id", parent: "lists" }],
  },
  {
    name: "routine_steps",
    columns: ["text", "position", "created_at"],
    remap: [{ column: "routine_id", parent: "routines" }],
  },
  {
    name: "log_entries",
    columns: ["value", "note", "logged_at", "created_at"],
    remap: [{ column: "tracker_id", parent: "trackers" }],
  },
  {
    name: "routine_checks",
    columns: ["checked_on", "created_at"],
    remap: [{ column: "step_id", parent: "routine_steps" }],
  },
  {
    // project_id points at deals, which are not restored -> dropped.
    name: "todos",
    columns: [
      "text", "notes", "due_date", "priority", "done", "done_at", "position",
      "remind_at", "recur_freq", "recur_byweekday", "recur_day_of_month",
      "recur_until", "created_at",
    ],
    remap: [
      { column: "venture_id", parent: "ventures" },
      { column: "application_id", parent: "applications" },
    ],
  },
  {
    name: "goals",
    columns: ["title", "emoji", "why", "target_date", "status", "color", "position", "created_at"],
  },
  {
    name: "goal_milestones",
    columns: ["text", "done", "position", "created_at"],
    remap: [{ column: "goal_id", parent: "goals" }],
  },
  {
    name: "life_dates",
    columns: ["title", "emoji", "on_date", "repeat_yearly", "remind_days_before", "created_at"],
  },
  {
    name: "balance_checks",
    columns: ["checked_on", "scores", "created_at"],
  },
  {
    name: "transactions",
    columns: ["amount", "kind", "category", "note", "occurred_on", "created_at"],
  },
  {
    name: "bills",
    columns: ["name", "amount", "due_day", "category", "autopay", "active", "last_paid_on", "created_at"],
  },
  {
    name: "budgets",
    columns: ["category", "monthly", "created_at"],
  },
  {
    name: "pages",
    columns: ["title", "emoji", "kind", "content", "theme", "position", "created_at"],
  },
  {
    name: "scripts",
    columns: ["title", "emoji", "category", "body", "position", "created_at"],
  },
  {
    name: "call_logs",
    columns: ["who", "outcome", "note", "called_at"],
    remap: [{ column: "application_id", parent: "applications" }],
  },
  {
    name: "waiting_items",
    columns: ["text", "who", "since", "nudge_after_days", "resolved", "created_at"],
  },
  {
    name: "things",
    columns: ["item", "location", "updated_at"],
  },
];

const CHUNK = 200;

export interface RestoreResult {
  restored: Record<string, number>;
  skipped: Record<string, number>;
  total: number;
}

export const importBackup = async (
  backup: Record<string, unknown>,
  salesId: number,
): Promise<RestoreResult> => {
  const supabase = getSupabaseClient();
  // old id -> new id, per parent table
  const idMaps = new Map<string, Map<number, number>>();
  const restored: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  let total = 0;

  for (const spec of TABLES) {
    const raw = backup[spec.name];
    if (!Array.isArray(raw) || raw.length === 0) continue;

    const prepared: { oldId: number; row: Row }[] = [];
    let skip = 0;

    for (const src of raw as Row[]) {
      const row: Row = { sales_id: salesId };
      for (const col of spec.columns) {
        if (col in src) row[col] = src[col];
      }
      let orphan = false;
      for (const rm of spec.remap ?? []) {
        const oldRef = src[rm.column];
        if (oldRef == null) {
          row[rm.column] = null;
          continue;
        }
        const mapped = idMaps.get(rm.parent)?.get(Number(oldRef));
        if (mapped == null) {
          // Parent wasn't in the backup (or failed) — for optional links,
          // drop the link; for required FKs (child tables), skip the row.
          const required =
            spec.name === "list_items" ||
            spec.name === "routine_steps" ||
            spec.name === "log_entries" ||
            spec.name === "routine_checks" ||
            spec.name === "goal_milestones";
          if (required) {
            orphan = true;
            break;
          }
          row[rm.column] = null;
        } else {
          row[rm.column] = mapped;
        }
      }
      if (orphan) {
        skip++;
        continue;
      }
      prepared.push({ oldId: Number(src.id), row });
    }

    const map = new Map<number, number>();
    for (let i = 0; i < prepared.length; i += CHUNK) {
      const batch = prepared.slice(i, i + CHUNK);
      // budgets has unique(sales_id, category) — skip duplicates on restore.
      const query =
        spec.name === "budgets"
          ? supabase
              .from(spec.name)
              .upsert(batch.map((b) => b.row), {
                onConflict: "sales_id,category",
                ignoreDuplicates: true,
              })
          : supabase.from(spec.name).insert(batch.map((b) => b.row));
      const { data, error } = await query.select("id");
      if (error) throw new Error(`${spec.name}: ${error.message}`);
      // PostgREST returns inserted rows in insertion order -> positional map.
      // (Not valid for the budgets upsert, where duplicates are skipped --
      // budgets has no children, so no map is needed there.)
      if (spec.name !== "budgets") {
        (data ?? []).forEach((inserted: { id: number }, idx: number) => {
          map.set(batch[idx].oldId, inserted.id);
        });
      }
    }
    idMaps.set(spec.name, map);
    restored[spec.name] = prepared.length;
    if (skip > 0) skipped[spec.name] = skip;
    total += prepared.length;
  }

  return { restored, skipped, total };
};
