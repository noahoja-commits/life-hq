import { useGetList } from "ra-core";

/* -------------------------------------------------------------------------- */
/*  Rank definitions                                                          */
/* -------------------------------------------------------------------------- */

interface Rank {
  name: string;
  min: number;
  emoji: string;
  textClass: string;
  barClass: string;
}

const RANKS: Rank[] = [
  {
    name: "Damned Soul",
    min: 0,
    emoji: "💀",
    textClass: "text-gray-400",
    barClass: "bg-gray-500",
  },
  {
    name: "Imp",
    min: 10,
    emoji: "👹",
    textClass: "text-amber-400",
    barClass: "bg-amber-500",
  },
  {
    name: "Demon",
    min: 50,
    emoji: "😈",
    textClass: "text-red-600",
    barClass: "bg-red-600",
  },
  {
    name: "Archfiend",
    min: 100,
    emoji: "👑",
    textClass: "text-purple-400",
    barClass: "bg-purple-500",
  },
  {
    name: "Duke of Hell",
    min: 250,
    emoji: "🔥",
    textClass: "text-yellow-400",
    barClass: "bg-yellow-500",
  },
  {
    name: "Prince of Darkness",
    min: 500,
    emoji: "🌑",
    textClass: "text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]",
    barClass: "bg-red-500",
  },
  {
    name: "Lucifer's Equal",
    min: 1000,
    emoji: "⭐",
    textClass:
      "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]",
    barClass: "bg-white",
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const rankFor = (total: number): Rank => {
  let best = RANKS[0];
  for (const r of RANKS) {
    if (total >= r.min) best = r;
  }
  return best;
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const InfernalRank = () => {
  /* ── Data ──────────────────────────────────────────────────────────────── */
  const { total: totalTodos } = useGetList("todos", {
    pagination: { page: 1, perPage: 1 },
    filter: { done: true },
  });

  const { total: totalGoals } = useGetList("goals", {
    pagination: { page: 1, perPage: 1 },
    filter: { status: "achieved" },
  });

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const sum = (totalTodos ?? 0) + (totalGoals ?? 0);
  const current = rankFor(sum);

  // Index of the current rank so we can find the next tier
  const currentIdx = RANKS.indexOf(current);
  const next = RANKS[currentIdx + 1] ?? null;

  // Progress: how far through the current bracket (0–100%)
  const bracketFloor = current.min;
  const bracketCeil = next ? next.min : current.min + 1; // Lucifer's Equal: full
  const bracketSize = bracketCeil - bracketFloor;
  const progress = Math.min(
    100,
    bracketSize > 0
      ? Math.round(((sum - bracketFloor) / bracketSize) * 100)
      : 100,
  );

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {/* Rank label */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
          Rank
        </span>
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${current.textClass}`}
        >
          {current.emoji} {current.name}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-sidebar-foreground/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${current.barClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtle xp hint */}
      <div className="flex justify-between text-[9px] uppercase tracking-wider text-sidebar-foreground/25">
        <span>{sum} souls</span>
        {next && <span>next: {next.name}</span>}
      </div>
    </div>
  );
};

export default InfernalRank;
