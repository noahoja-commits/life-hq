import { cn } from "@/lib/utils";
import { fmt$, monthKey, pad, type Bill, type Txn } from "./MoneyPage";

interface MoneyInsightsProps {
  txns: Txn[];
  /** Active bills only — same set passed to BillsSection. */
  bills: Bill[];
  spentByCat: Map<string, number>;
}

interface MonthNet {
  key: string; // YYYY-MM
  net: number;
  hasData: boolean;
}

interface UpcomingBill {
  bill: Bill;
  daysUntil: number; // negative = overdue, 0 = due today, positive = due in N days
}

/** Last 6 calendar months (local time), oldest first, including the current month. */
const last6MonthKeys = (): string[] => {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  }
  return keys;
};

const monthDate = (key: string): Date => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
};

const monthInitial = (key: string): string =>
  monthDate(key).toLocaleDateString(undefined, { month: "short" }).charAt(0);

const monthLabel = (key: string): string =>
  monthDate(key).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

const computeNets = (txns: Txn[]): MonthNet[] =>
  last6MonthKeys().map((key) => {
    const monthTxns = txns.filter((t) => t.occurred_on.slice(0, 7) === key);
    const income = monthTxns
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = monthTxns
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { key, net: income - expense, hasData: monthTxns.length > 0 };
  });

const computeTopCategories = (
  spentByCat: Map<string, number>,
): [string, number][] =>
  [...spentByCat.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

/**
 * Days until each bill's due day this month, clamped to month length (mirrors
 * the clamping in MoneyPage's `nextDue`). Unlike `nextDue` — which always
 * rolls forward to a future/current date — this can go negative, which is
 * what lets an unpaid bill past its due day show as "overdue" here.
 */
const computeUpcomingBills = (bills: Bill[]): UpcomingBill[] => {
  const mk = monthKey();
  const now = new Date();
  const lastDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  return bills
    .filter((b) => !b.autopay)
    .filter((b) => !(b.last_paid_on && b.last_paid_on.startsWith(mk)))
    .map((b) => ({
      bill: b,
      daysUntil: Math.min(b.due_day, lastDayOfMonth) - now.getDate(),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);
};

const dueLabel = (daysUntil: number): string => {
  if (daysUntil < 0) return "overdue";
  if (daysUntil === 0) return "due today";
  return `due in ${daysUntil}d`;
};

export const MoneyInsights = ({ txns, bills, spentByCat }: MoneyInsightsProps) => {
  const nets = computeNets(txns);
  const topCategories = computeTopCategories(spentByCat);
  const upcomingBills = computeUpcomingBills(bills);

  const showTrend = nets.filter((n) => n.hasData).length >= 2;
  const showCategories = topCategories.length > 0;
  const showBills = upcomingBills.length > 0;

  if (!showTrend && !showCategories && !showBills) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="u-label text-muted-foreground">Insights</h2>
      {(showTrend || showCategories) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {showTrend && <TrendChart nets={nets} />}
          {showCategories && <CategoryBreakdown categories={topCategories} />}
        </div>
      )}
      {showBills && <UpcomingBills bills={upcomingBills} />}
    </section>
  );
};

const TrendChart = ({ nets }: { nets: MonthNet[] }) => {
  const maxAbs = Math.max(...nets.map((n) => Math.abs(n.net)), 1);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="u-label mb-3 text-muted-foreground">Six-month trend</h3>
      <div className="flex items-end gap-2">
        {nets.map((n) => {
          const pct =
            n.net === 0 ? 0 : Math.max(Math.round((Math.abs(n.net) / maxAbs) * 100), 6);
          return (
            <div
              key={n.key}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${monthLabel(n.key)}: ${fmt$(n.net)}`}
            >
              <div className="flex h-16 w-full items-end justify-center">
                <div
                  className={cn(
                    "w-full max-w-6 rounded-sm",
                    n.net >= 0 ? "bg-success" : "bg-destructive/70",
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {monthInitial(n.key)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CategoryBreakdown = ({
  categories,
}: {
  categories: [string, number][];
}) => {
  const max = categories[0][1];

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="u-label mb-3 text-muted-foreground">
        This month by category
      </h3>
      <div className="flex flex-col gap-2.5">
        {categories.map(([cat, amount]) => (
          <div key={cat} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px]">{cat}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {fmt$(amount)}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round((amount / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UpcomingBills = ({ bills }: { bills: UpcomingBill[] }) => (
  <div className="rounded-lg border bg-card p-4">
    <h3 className="u-label mb-3 text-muted-foreground">Upcoming bills</h3>
    <div className="flex flex-col divide-y divide-border">
      {bills.map(({ bill, daysUntil }) => (
        <div
          key={bill.id}
          className="flex items-center gap-3 py-2 text-[13px] first:pt-0 last:pb-0"
        >
          <span className="flex-1 truncate">{bill.name}</span>
          <span className="tabular-nums text-muted-foreground">
            {fmt$(Number(bill.amount))}
          </span>
          <span
            className={cn(
              "shrink-0 text-xs",
              daysUntil <= 2 ? "font-medium text-warning" : "text-muted-foreground",
            )}
          >
            {dueLabel(daysUntil)}
          </span>
        </div>
      ))}
    </div>
  </div>
);
