import { getSupabaseClient } from "../providers/supabase/supabase";
import { NAV_ITEMS, type NavItem } from "./navConfig";

// User nav preferences (hidden sections + custom order), synced across
// devices via user_prefs.prefs.nav — same pattern as sectionThemesStore.
export interface NavPrefs {
  hidden: string[];
  order: string[];
  /** User-pinned primary row (header pills + mobile bar). Empty = defaults. */
  primary?: string[];
}

const KEY = "lifehq-nav-prefs";
const EMPTY: NavPrefs = { hidden: [], order: [], primary: [] };

const read = (): NavPrefs => {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return p && Array.isArray(p.hidden) && Array.isArray(p.order)
      ? { primary: [], ...p }
      : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cache: NavPrefs = read();
let loadedFor: number | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function persist(salesId: number) {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("user_prefs")
      .select("id, prefs")
      .eq("sales_id", salesId)
      .maybeSingle();
    if (data) {
      await supabase
        .from("user_prefs")
        .update({
          prefs: { ...((data.prefs as object) ?? {}), nav: cache },
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    } else {
      await supabase.from("user_prefs").insert({ sales_id: salesId, prefs: { nav: cache } });
    }
  } catch {
    // offline — localStorage keeps it
  }
}

export const navPrefsStore = {
  get: (): NavPrefs => cache,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async load(salesId: number): Promise<void> {
    if (loadedFor === salesId) return;
    loadedFor = salesId;
    try {
      const { data } = await getSupabaseClient()
        .from("user_prefs")
        .select("prefs")
        .eq("sales_id", salesId)
        .maybeSingle();
      const remote = (data?.prefs as { nav?: NavPrefs } | null)?.nav;
      if (remote && Array.isArray(remote.hidden) && Array.isArray(remote.order)) {
        cache = remote;
        localStorage.setItem(KEY, JSON.stringify(cache));
        emit();
      }
    } catch {
      // stay local
    }
  },
  set(next: NavPrefs, salesId: number | null): void {
    cache = next;
    localStorage.setItem(KEY, JSON.stringify(next));
    emit();
    if (salesId) void persist(salesId);
  },
};

// Sections that must always stay visible.
const LOCKED = new Set(["dashboard", "settings"]);

/** NAV_ITEMS in the user's order; hidden filtered unless includeHidden. */
export const applyNavPrefs = (
  prefs: NavPrefs,
  { includeHidden = false }: { includeHidden?: boolean } = {},
): NavItem[] => {
  const rank = new Map(prefs.order.map((k, i) => [k, i]));
  const ordered = [...NAV_ITEMS].sort((a, b) => {
    const ra = rank.has(a.key) ? rank.get(a.key)! : 1000 + NAV_ITEMS.indexOf(a);
    const rb = rank.has(b.key) ? rank.get(b.key)! : 1000 + NAV_ITEMS.indexOf(b);
    return ra - rb;
  });
  return includeHidden
    ? ordered
    : ordered.filter((n) => LOCKED.has(n.key) || !prefs.hidden.includes(n.key));
};

export const isLockedNavKey = (key: string) => LOCKED.has(key);

/** Is this item in the primary header row? User pins override the defaults. */
export const isPrimaryNav = (prefs: NavPrefs, item: NavItem): boolean => {
  if (item.key === "dashboard") return true; // home stays pinned
  if (prefs.primary && prefs.primary.length > 0) return prefs.primary.includes(item.key);
  return !!item.primary;
};

/** Current effective primary keys (used to seed the first user toggle). */
export const effectivePrimaryKeys = (prefs: NavPrefs): string[] =>
  NAV_ITEMS.filter((n) => isPrimaryNav(prefs, n)).map((n) => n.key);
