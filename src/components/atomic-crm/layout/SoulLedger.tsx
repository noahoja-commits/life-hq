import { useGetList } from "ra-core";

/** Soul Ledger — counts completed todos as "souls claimed." Displayed in the header. */
export const SoulLedger = () => {
  const { data } = useGetList("todos", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "id", order: "DESC" },
    filter: { done: true },
  });

  const soulsClaimed = data?.length ?? 0;

  // Also count achieved goals
  const { data: goals } = useGetList("goals", {
    pagination: { page: 1, perPage: 100 },
    filter: { status: "achieved" },
  });

  const goalsAchieved = goals?.length ?? 0;
  const total = soulsClaimed + goalsAchieved;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
      <span className="text-[#c41e3a]">⛧</span>
      <span>SOULS CLAIMED: {total}</span>
    </div>
  );
};
