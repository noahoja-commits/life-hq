/** Memory Bridge — persistent memory for Lucifer across sessions. Stores conversation summaries in Supabase. */
import { getSupabaseClient } from "../providers/supabase/supabase";

const MEMORY_KEY = "lucifer_memory";

interface MemoryEntry {
  id: string;
  summary: string;
  timestamp: string;
  tags: string[];
}

/** Save a conversation summary to Lucifer's memory vault */
export const saveMemory = async (summary: string, tags: string[] = [], salesId?: number) => {
  const supabase = getSupabaseClient();
  try {
    await supabase.from("pages").insert({
      title: `Memory: ${summary.slice(0, 50)}`,
      content: summary,
      sales_id: salesId,
    });
  } catch { /* Memory failed silently — non-critical */ }

  // Also cache in localStorage for fast retrieval
  const cache = JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]");
  cache.unshift({ id: Date.now().toString(), summary, timestamp: new Date().toISOString(), tags });
  if (cache.length > 20) cache.length = 20;
  localStorage.setItem(MEMORY_KEY, JSON.stringify(cache));
};

/** Retrieve recent memories for context injection */
export const getMemories = (limit = 5): MemoryEntry[] => {
  try {
    const cache = JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]");
    return cache.slice(0, limit);
  } catch { return []; }
};

/** Build a memory context string for injection into Lucifer's prompt */
export const buildMemoryContext = (): string => {
  const memories = getMemories(5);
  if (memories.length === 0) return "";
  return `\n\nRECENT MEMORIES (from previous conversations):\n${memories.map((m) => `- ${m.summary}`).join("\n")}`;
};
