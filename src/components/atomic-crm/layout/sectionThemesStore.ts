import { getSupabaseClient } from "../providers/supabase/supabase";

// Per-section accent colors, synced across devices via user_prefs.prefs
// .sectionThemes. localStorage gives instant paint; the DB copy wins on load
// so a color picked on the phone shows up on the laptop.
const KEY = "lifehq-section-themes";

const read = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
};

let cache: Record<string, string> = read();
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
          prefs: { ...((data.prefs as object) ?? {}), sectionThemes: cache },
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    } else {
      await supabase
        .from("user_prefs")
        .insert({ sales_id: salesId, prefs: { sectionThemes: cache } });
    }
  } catch {
    // Offline / RLS hiccup — localStorage still has it; next set retries.
  }
}

export const sectionThemesStore = {
  get: (): Record<string, string> => cache,

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Pull the synced copy once per session (remote wins over local). */
  async load(salesId: number): Promise<void> {
    if (loadedFor === salesId) return;
    loadedFor = salesId;
    try {
      const { data } = await getSupabaseClient()
        .from("user_prefs")
        .select("prefs")
        .eq("sales_id", salesId)
        .maybeSingle();
      const remote = (data?.prefs as { sectionThemes?: Record<string, string> } | null)
        ?.sectionThemes;
      if (remote && typeof remote === "object") {
        cache = { ...cache, ...remote };
        localStorage.setItem(KEY, JSON.stringify(cache));
        emit();
      }
    } catch {
      // stay on local copy
    }
  },

  set(key: string, accent: string | null, salesId: number | null): void {
    const next = { ...cache };
    if (accent) next[key] = accent;
    else delete next[key];
    cache = next;
    localStorage.setItem(KEY, JSON.stringify(next));
    emit();
    if (salesId) void persist(salesId);
  },
};
