import { useState } from "react";
import {
  useGetList,
  useGetIdentity,
  useCreate,
  useUpdate,
  useDelete,
  useNotify,
} from "ra-core";
import {
  Plus,
  Trash2,
  ReceiptText,
  Target,
  CheckCircle2,
  Zap,
  Wallet,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useConfirm } from "../misc/useConfirm";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { EmptyState } from "../misc/EmptyState";
import { useUndoable } from "../misc/useUndoable";
import { usePageHotkey } from "../misc/usePageHotkey";

interface Txn {
  id: number;
  amount: number;
  kind: "income" | "expense";
  category: string;
  note?: string;
  occurred_on: string;
}
interface Bill {
  id: number;
  name: string;
  amount: number;
  due_day: number;
  category?: string;
  autopay: boolean;
  active: boolean;
  last_paid_on?: string | null;
}
interface Budget {
  id: number;
  category: string;
  monthly: number;
}

const EXPENSE_CATS = [
  "Housing",
  "Food",
  "Transport",
  "Bills",
  "Health",
  "Fun",
  "Shopping",
  "Other",
];

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const monthKey = () => todayStr().slice(0, 7); // YYYY-MM
const fmt$ = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 ? 2 : 0,
  });

/** Next occurrence of a bill's due day (clamped to month length). */
const nextDue = (dueDay: number): string => {
  const now = new Date();
  const mk = (y: number, m: number) => {
    const last = new Date(y, m + 1, 0).getDate();
    return `${y}-${pad(m + 1)}-${pad(Math.min(dueDay, last))}`;
  };
  const thisMonth = mk(now.getFullYear(), now.getMonth());
  if (thisMonth >= todayStr()) return thisMonth;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return mk(next.getFullYear(), next.getMonth());
};

export const MoneyPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const haptic = useHaptics();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const { confirm, confirmUI } = useConfirm();
  const { deleteWithUndo } = useUndoable();
  usePageHotkey("n", () => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Amount"]');
    input?.focus();
  });
  const salesId = identity?.id ? Number(identity.id) : null;

  const { data: txns, isPending } = useGetList<Txn>("transactions", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "occurred_on", order: "DESC" },
  });
  const { data: bills } = useGetList<Bill>("bills", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "due_day", order: "ASC" },
  });
  const { data: budgets } = useGetList<Budget>("budgets", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "category", order: "ASC" },
  });

  // Quick-add state
  const [amount, setAmount] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [cat, setCat] = useState("Food");
  const [note, setNote] = useState("");
  const [txnDate, setTxnDate] = useState("");
  const [search, setSearch] = useState("");

  const mk = monthKey();
  const monthTxns = (txns ?? []).filter((t) => t.occurred_on.startsWith(mk));
  const incomeMo = monthTxns
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const spentMo = monthTxns
    .filter((t) => t.kind === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const spentByCat = new Map<string, number>();
  for (const t of monthTxns) {
    if (t.kind !== "expense") continue;
    spentByCat.set(
      t.category,
      (spentByCat.get(t.category) ?? 0) + Number(t.amount),
    );
  }
  const activeBills = (bills ?? []).filter((b) => b.active);
  const billsMoTotal = activeBills.reduce((s, b) => s + Number(b.amount), 0);

  const itemMatchesSearch = (item: any, q: string) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    const fields = [item.name, item.note, item.category];
    return fields.some((f) => f && String(f).toLowerCase().includes(s));
  };

  const addTxn = () => {
    const val = Number(amount);
    if (!val || Number.isNaN(val)) return;
    haptic("tick");
    create(
      "transactions",
      {
        data: {
          amount: Math.abs(val),
          kind: isIncome ? "income" : "expense",
          category: isIncome ? "Income" : cat,
          note: note.trim(),
          occurred_on: txnDate || todayStr(),
          sales_id: salesId,
        },
      },
      {
        onSuccess: () => {
          setAmount("");
          setNote("");
          setTxnDate("");
        },
        onError: () => notify("Could not add", { type: "error" }),
      },
    );
  };

  const markPaid = (b: Bill) => {
    haptic("success");
    update(
      "bills",
      { id: b.id, data: { last_paid_on: todayStr() }, previousData: b },
      { mutationMode: "optimistic" },
    );
    // Log it as an expense too, so budgets/summary stay honest.
    create(
      "transactions",
      {
        data: {
          amount: Number(b.amount),
          kind: "expense",
          category: b.category || "Bills",
          note: b.name,
          occurred_on: todayStr(),
          sales_id: salesId,
        },
      },
      {
        onError: () =>
          notify("Bill marked paid, but logging the expense failed", {
            type: "warning",
          }),
      },
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Money</h1>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card sm:grid-cols-4">
        <StatCard
          label="In"
          value={fmt$(incomeMo)}
          dotClass="bg-success"
          valueClass="text-success"
        />
        <StatCard
          label="Out"
          value={fmt$(spentMo)}
          dotClass="bg-destructive"
          valueClass="text-destructive"
          className="border-l"
        />
        <StatCard
          label="Net"
          value={fmt$(incomeMo - spentMo)}
          dotClass={incomeMo - spentMo >= 0 ? "bg-success" : "bg-destructive"}
          valueClass={
            incomeMo - spentMo >= 0 ? "text-success" : "text-destructive"
          }
          className="max-sm:border-t sm:border-l"
        />
        <StatCard
          label="Bills / mo"
          value={fmt$(billsMoTotal)}
          dotClass="bg-warning"
          className="border-l max-sm:border-t"
        />
      </div>

      {/* Quick add */}
      <Card className="flex flex-col items-stretch gap-2 p-3 sm:flex-row sm:items-center">
        <div className="flex self-start rounded-md bg-muted p-0.5 text-xs sm:self-auto">
          {(["out", "in"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setIsIncome(v === "in")}
              className={cn(
                "rounded-[5px] px-2.5 py-1 font-medium transition-colors",
                (v === "in") === isIncome
                  ? v === "in"
                    ? "bg-background text-success shadow-xs"
                    : "bg-background text-destructive shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "in" ? "+ Income" : "− Expense"}
            </button>
          ))}
        </div>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTxn()}
          placeholder="0.00"
          className="w-28 text-right font-semibold"
          aria-label="Amount"
        />
        {!isIncome && (
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTxn()}
          placeholder="Note (optional)"
          className="flex-1"
        />
        <input
          type="date"
          value={txnDate}
          onChange={(e) => setTxnDate(e.target.value)}
          className="rounded-md border px-2 py-1.5 bg-transparent text-sm"
          aria-label="Transaction date (defaults to today)"
          title="Date (defaults to today)"
        />
        <Button
          onClick={addTxn}
          size="icon"
          className="shrink-0 rounded-md"
          aria-label="Add"
        >
          <Plus className="size-4" />
        </Button>
      </Card>

      {/* Budgets */}
      <BudgetsSection
        budgets={(budgets ?? []).filter((b) =>
          itemMatchesSearch(b, search),
        )}
        spentByCat={spentByCat}
        salesId={salesId}
      />

      {/* Bills */}
      <BillsSection
        bills={activeBills.filter((b) => itemMatchesSearch(b, search))}
        onPaid={markPaid}
        onDelete={(b) =>
          confirm(`Delete bill "${b.name}"?`, () =>
            deleteWithUndo("bills", { id: b.id, previousData: b }),
          )
        }
        salesId={salesId}
      />

      {/* Recent transactions */}
      <section>
        <h2 className="u-label mb-2 text-muted-foreground">Recent</h2>
        {isPending && (txns ?? []).length === 0 ? (
          <CardsSkeleton count={2} className="grid grid-cols-1 gap-2" />
        ) : (txns ?? []).length === 0 ? (
          search.trim() ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions match your search.
            </p>
          ) : (
            <EmptyState
              icon={Wallet}
              title="No transactions yet"
              description="Log your first one above."
              action={{
                label: "Add transaction",
                onClick: () => {
                  const input = document.querySelector<HTMLInputElement>('input[aria-label="Amount"]');
                  input?.focus();
                },
              }}
            />
          )
        ) : (
          (() => {
            const filtered = (txns ?? [])
              .filter((t) => itemMatchesSearch(t, search))
              .slice(0, 25);
            if (filtered.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions match your search.
                </p>
              );
            }
            return (
              <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
                {filtered.map((t) => (
                  <div
                    key={t.id}
                    className="group flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-accent/50"
                  >
                    <span
                      className={cn(
                        "w-20 font-medium tabular-nums",
                        t.kind === "income"
                          ? "text-success"
                          : "text-destructive",
                      )}
                    >
                      {t.kind === "income" ? "+" : "−"}
                      {fmt$(Number(t.amount))}
                    </span>
                    <span className="rounded-md border bg-card px-2.5 py-1 text-xs">
                      {t.category}
                    </span>
                    <span className="flex-1 truncate text-muted-foreground">
                      {t.note}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(
                        t.occurred_on + "T00:00:00",
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() =>
                        deleteWithUndo("transactions", {
                          id: t.id,
                          previousData: t,
                        })
                      }
                      className="text-muted-foreground opacity-60 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </section>
      {confirmUI}
    </div>
  );
};

MoneyPage.path = "/money";

const StatCard = ({
  label,
  value,
  dotClass,
  valueClass,
  className,
}: {
  label: string;
  value: string;
  dotClass: string;
  valueClass?: string;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-1.5 px-4 py-3", className)}>
    <span
      className={cn(
        "text-lg leading-none font-semibold tabular-nums",
        valueClass,
      )}
    >
      {value}
    </span>
    <span className="u-label flex items-center gap-1.5 text-muted-foreground/80">
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  </div>
);

// ── Budgets ─────────────────────────────────────────────────────────────────
const BudgetsSection = ({
  budgets,
  spentByCat,
  salesId,
}: {
  budgets: Budget[];
  spentByCat: Map<string, number>;
  salesId: number | null;
}) => {
  const [create] = useCreate();
  const [update] = useUpdate();
  const { deleteWithUndo } = useUndoable();
  const notify = useNotify();
  const [newCat, setNewCat] = useState("Food");
  const [newAmt, setNewAmt] = useState("");
  const unbudgeted = EXPENSE_CATS.filter(
    (c) => !budgets.some((b) => b.category === c),
  );

  // Keep the picker on a category that's actually still unbudgeted.
  const effectiveCat = unbudgeted.includes(newCat)
    ? newCat
    : (unbudgeted[0] ?? "");
  const add = () => {
    const val = Number(newAmt);
    if (!val || !effectiveCat) return;
    create(
      "budgets",
      { data: { category: effectiveCat, monthly: val, sales_id: salesId } },
      { onError: () => notify("Could not add budget", { type: "error" }) },
    );
    setNewAmt("");
  };

  return (
    <section>
      <h2 className="u-label mb-2 flex items-center gap-1.5 text-muted-foreground">
        <Target className="size-3.5" /> Budgets this month
      </h2>
      <Card className="flex flex-col gap-3 p-4">
        {budgets.length === 0 && (
          <p className="text-[13px] text-muted-foreground">
            Set a monthly cap per category — the bar fills as you spend. Gentle,
            not punitive.
          </p>
        )}
        {budgets.map((b) => {
          const spent = spentByCat.get(b.category) ?? 0;
          const pct = Math.min(
            100,
            Math.round((spent / Number(b.monthly)) * 100),
          );
          const over = spent > Number(b.monthly);
          return (
            <div key={b.id} className="group flex items-center gap-3">
              <span className="w-20 shrink-0 text-[13px]">{b.category}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    over
                      ? "bg-destructive"
                      : pct > 80
                        ? "bg-warning"
                        : "bg-primary",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {fmt$(spent)} / {fmt$(Number(b.monthly))}
              </span>
              <button
                onClick={() =>
                  deleteWithUndo("budgets", { id: b.id, previousData: b })
                }
                className="text-muted-foreground opacity-60 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                aria-label={`Remove ${b.category} budget`}
              >
                <Trash2 className="size-3.5" />
              </button>
              <input
                type="number"
                defaultValue={Number(b.monthly)}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v && v !== Number(b.monthly))
                    update(
                      "budgets",
                      { id: b.id, data: { monthly: v }, previousData: b },
                      { mutationMode: "optimistic" },
                    );
                }}
                className="hidden w-20 rounded-md border bg-transparent px-2 py-1 text-xs tabular-nums sm:block"
                aria-label={`${b.category} budget amount`}
              />
            </div>
          );
        })}
        {unbudgeted.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <Select value={effectiveCat} onValueChange={setNewCat}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unbudgeted.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={newAmt}
              onChange={(e) => setNewAmt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="$/month"
              className="h-8 w-24 text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1"
              onClick={add}
            >
              <Plus className="size-3.5" /> Budget
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
};

// ── Bills ───────────────────────────────────────────────────────────────────
const BillsSection = ({
  bills,
  onPaid,
  onDelete,
  salesId,
}: {
  bills: Bill[];
  onPaid: (b: Bill) => void;
  onDelete: (b: Bill) => void;
  salesId: number | null;
}) => {
  const [create] = useCreate();
  const [name, setName] = useState("");
  const [amt, setAmt] = useState("");
  const [day, setDay] = useState("1");

  const add = () => {
    if (!name.trim() || !Number(amt)) return;
    create("bills", {
      data: {
        name: name.trim(),
        amount: Number(amt),
        due_day: Math.min(31, Math.max(1, Number(day) || 1)),
        sales_id: salesId,
      },
    });
    setName("");
    setAmt("");
  };

  const mk = monthKey();
  const sorted = [...bills].sort((a, b) =>
    nextDue(a.due_day).localeCompare(nextDue(b.due_day)),
  );
  const soonCutoff = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  return (
    <section>
      <h2 className="u-label mb-2 flex items-center gap-1.5 text-muted-foreground">
        <ReceiptText className="size-3.5" /> Bills & subscriptions
      </h2>
      <Card className="divide-y divide-border p-0">
        {sorted.map((b) => {
          const due = nextDue(b.due_day);
          const paidThisMonth =
            !!b.last_paid_on && b.last_paid_on.startsWith(mk);
          const dueSoon = !paidThisMonth && !b.autopay && due <= soonCutoff;
          return (
            <div
              key={b.id}
              className="group flex items-center gap-3 px-4 py-2.5 text-[13px]"
            >
              <span className="flex-1 truncate">{b.name}</span>
              {b.autopay && (
                <span className="flex items-center gap-0.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Zap className="size-2.5" /> auto
                </span>
              )}
              <span className="tabular-nums text-muted-foreground">
                {fmt$(Number(b.amount))}
              </span>
              <span
                className={cn(
                  "w-16 shrink-0 text-right text-xs",
                  dueSoon
                    ? "font-medium text-warning"
                    : "text-muted-foreground",
                )}
              >
                {new Date(due + "T00:00:00").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {paidThisMonth ? (
                <span className="flex w-16 items-center justify-end gap-1 text-xs text-success">
                  <CheckCircle2 className="size-3.5" /> paid
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-16 text-xs"
                  onClick={() => onPaid(b)}
                >
                  Paid
                </Button>
              )}
              <button
                onClick={() => onDelete(b)}
                className="text-muted-foreground opacity-60 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                aria-label={`Delete ${b.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        <div className="flex flex-wrap items-center gap-2 p-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bill name (Rent, Spotify…)"
            className="h-8 min-w-36 flex-1 text-sm"
          />
          <Input
            type="number"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder="$"
            className="h-8 w-20 text-sm"
          />
          <span className="text-xs text-muted-foreground">due day</span>
          <Input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="h-8 w-16 text-sm"
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            onClick={add}
          >
            <Plus className="size-3.5" /> Bill
          </Button>
        </div>
      </Card>
    </section>
  );
};
