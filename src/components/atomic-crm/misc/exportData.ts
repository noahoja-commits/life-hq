import { getSupabaseClient } from "../providers/supabase/supabase";

// Every table that holds the user's Life HQ data.
const TABLES = [
  "todos",
  "focus_sessions",
  "deals",
  "deal_notes",
  "contacts",
  "contact_notes",
  "companies",
  "tasks",
  "tags",
  "trackers",
  "log_entries",
  "lists",
  "list_items",
  "routines",
  "routine_steps",
  "routine_checks",
  "ventures",
  "applications",
  "hub_items",
  "goals",
  "goal_milestones",
  "life_dates",
  "balance_checks",
  "transactions",
  "bills",
  "budgets",
  "pages",
  "scripts",
  "call_logs",
  "waiting_items",
  "things",
  "user_prefs",
  "configuration",
] as const;

/**
 * Fetches all of the user's data (subject to RLS — only their own rows) and
 * triggers a download of a single timestamped JSON backup file.
 */
export const exportAllData = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  const dump: Record<string, unknown> = {
    app: "Life HQ",
    exported_at: new Date().toISOString(),
  };

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      // Skip tables the user can't read rather than failing the whole backup.
      dump[table] = { error: error.message };
    } else {
      dump[table] = data ?? [];
    }
  }

  const blob = new Blob([JSON.stringify(dump, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `life-hq-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
