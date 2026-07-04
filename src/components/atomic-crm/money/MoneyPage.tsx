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
  Wallet,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  Target,
  CheckCircle2,
  Zap,
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

const EXPENSE_CATS = ["Housing", "Food", "Transport", "Bills", "Health", "Fun", "Shopping", "Other"];

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const monthKey = () => todayStr().slice(0, 7); // YYYY-MM
const fmt$ = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });

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

  const mk = monthKey();
  const monthTxns = (txns ?? []).filter((t) => t.occurred_on.startsWith(mk));
  const incomeMo = monthTxns.filter((t) => t.kind === "income").reduce((s, t) => s + Number(t.amount), 0);
  const spentMo = monthTxns.filter((t) => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const spentByCat = new Map<string, number>();
  for (const t of monthTxns) {
    if (t.kind !== "expense") continue;
    spentByCat.set(t.category, (spentByCat.get(t.category) ?? 0) + Number(t.amount));
  }
  const activeBills = (bills ?? []).filter((b) => b.active);
  const billsMoTotal = activeBills.reduce((s, b) => s + Number(b.amount), 0);

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
      { onError: () => notify("Bill marked paid, but logging the expense failed", { type: "warning" }) },
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Wallet className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Money</h1>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="In" value={fmt$(incomeMo)} tone="text-green-500" />
        <StatCard icon={TrendingDown} label="Out" value={fmt$(spentMo)} tone="text-rose-400" />
        <StatCard
          icon={Wallet}
          label="Net"
          value={fmt$(incomeMo - spentMo)}
          tone={incomeMo - spentMo >= 0 ? "text-green-500" : "text-rose-400"}
        />
        <StatCard icon={ReceiptText} label="Bills / mo" value={fmt$(billsMoTotal)} tone="text-amber-400" />
      </div>

      {/* Quick add */}
      <Card className="p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex rounded-full border p-0.5 text-xs self-start sm:self-auto">
          {(["out", "in"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setIsIncome(v === "in")}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                (v === "in") === isIncome
                  ? v === "in"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-rose-500/20 text-rose-400"
                  : "text-muted-foreground",
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
        <Button onClick={addTxn} size="icon" className="rounded-full shrink-0" aria-label="Add">
          <Plus className="size-4" />
        </Button>
      </Card>

      {/* Budgets */}
      <BudgetsSection
        budgets={budgets ?? []}
        spentByCat={spentByCat}
        salesId={salesId}
      />

      {/* Bills */}
      <BillsSection
        bills={activeBills}
        onPaid={markPaid}
        onDelete={(b) =>
          confirm(`Delete bill "${b.name}"?`, () =>
            remove("bills", { id: b.id, previousData: b }, { mutationMode: "optimistic" }),
          )
        }
        salesId={salesId}
      />

      {/* Recent transactions */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Recent
        </h2>
        {isPending && (txns ?? []).length === 0 ? (
          <CardsSkeleton count={2} className="grid grid-cols-1 gap-2" />
        ) : (txns ?? []).length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">
            No transactions yet — log your first one above.
          </Card>
        ) : (
          <Card className="divide-y p-0">
            {(txns ?? []).slice(0, 25).map((t) => (
              <div key={t.id} className="group flex items-center gap-3 px-4 py-2 text-sm">
                <span
                  className={cn(
                    "font-semibold tabular-nums w-20",
                    t.kind === "income" ? "text-green-500" : "text-rose-400",
                  )}
                >
                  {t.kind === "income" ? "+" : "−"}
                  {fmt$(Number(t.amount))}
                </span>
                <span className="text-xs rounded-full bg-accent px-2 py-0.5">{t.category}</span>
                <span className="flex-1 truncate text-muted-foreground">{t.note}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(t.occurred_on + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <button
                  onClick={() =>
                    remove("transactions", { id: t.id, previousData: t }, { mutationMode: "optimistic" })
                  }
                  className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  aria-label="Delete transaction"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </Card>
        )}
      </section>
      {confirmUI}
    </div>
  );
};

MoneyPage.path = "/money";

const StatCard = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: string;
}) => (
  <Card className="p-3 flex flex-col gap-1">
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className={cn("size-3.5", tone)} /> {label}
    </span>
    <span className={cn("text-lg font-semibold tabular-nums", tone)}>{value}</span>
  </Card>
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
  const [remove] = useDelete();
  const notify = useNotify();
  const [newCat, setNewCat] = useState("Food");
  const [newAmt, setNewAmt] = useState("");
  const unbudgeted = EXPENSE_CATS.filter((c) => !budgets.some((b) => b.category === c));

  // Keep the picker on a category that's actually still unbudgeted.
  const effectiveCat = unbudgeted.includes(newCat) ? newCat : (unbudgeted[0] ?? "");
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
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <Target className="size-3.5" /> Budgets this month
      </h2>
      <Card className="p-4 flex flex-col gap-3">
        {budgets.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Set a monthly cap per category — the bar fills as you spend. Gentle,
            not punitive.
          </p>
        )}
        {budgets.map((b) => {
          const spent = spentByCat.get(b.category) ?? 0;
          const pct = Math.min(100, Math.round((spent / Number(b.monthly)) * 100));
          const over = spent > Number(b.monthly);
          return (
            <div key={b.id} className="group flex items-center gap-3">
              <span className="w-20 text-sm shrink-0">{b.category}</span>
              <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: over ? "#fb7185" : pct > 80 ? "#f59e0b" : "var(--primary)",
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {fmt$(spent)} / {fmt$(Number(b.monthly))}
              </span>
              <button
                onClick={() =>
                  remove("budgets", { id: b.id, previousData: b }, { mutationMode: "optimistic" })
                }
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
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
                    update("budgets", { id: b.id, data: { monthly: v }, previousData: b }, { mutationMode: "optimistic" });
                }}
                className="w-20 rounded-md border px-2 py-1 text-xs bg-transparent tabular-nums hidden sm:block"
                aria-label={`${b.category} budget amount`}
              />
            </div>
          );
        })}
        {unbudgeted.length > 0 && (
          <div className="flex gap-2 items-center pt-1">
            <Select value={effectiveCat} onValueChange={setNewCat}>
              <SelectTrigger className="w-32 h-8 text-xs">
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
              className="w-24 h-8 text-xs"
            />
            <Button size="sm" variant="secondary" className="h-8 gap-1" onClick={add}>
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
  const sorted = [...bills].sort((a, b) => nextDue(a.due_day).localeCompare(nextDue(b.due_day)));
  const soonCutoff = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <ReceiptText className="size-3.5" /> Bills & subscriptions
      </h2>
      <Card className="p-0 divide-y">
        {sorted.map((b) => {
          const due = nextDue(b.due_day);
          const paidThisMonth = !!b.last_paid_on && b.last_paid_on.startsWith(mk);
          const dueSoon = !paidThisMonth && !b.autopay && due <= soonCutoff;
          return (
            <div key={b.id} className="group flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="flex-1 truncate">{b.name}</span>
              {b.autopay && (
                <span className="text-[10px] rounded-full bg-sky-500/15 text-sky-400 px-2 py-0.5 flex items-center gap-0.5">
                  <Zap className="size-2.5" /> auto
                </span>
              )}
              <span className="tabular-nums text-muted-foreground">{fmt$(Number(b.amount))}</span>
              <span
                className={cn(
                  "text-xs shrink-0 w-16 text-right",
                  dueSoon ? "text-amber-500 font-medium" : "text-muted-foreground",
                )}
              >
                {new Date(due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              {paidThisMonth ? (
                <span className="text-green-500 flex items-center gap-1 text-xs w-16 justify-end">
                  <CheckCircle2 className="size-3.5" /> paid
                </span>
              ) : (
                <Button size="sm" variant="secondary" className="h-7 text-xs w-16" onClick={() => onPaid(b)}>
                  Paid
                </Button>
              )}
              <button
                onClick={() => onDelete(b)}
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${b.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        <div className="flex flex-wrap gap-2 items-center p-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bill name (Rent, Spotify…)"
            className="flex-1 min-w-36 h-8 text-sm"
          />
          <Input
            type="number"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder="$"
            className="w-20 h-8 text-sm"
          />
          <span className="text-xs text-muted-foreground">due day</span>
          <Input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-16 h-8 text-sm"
          />
          <Button size="sm" variant="secondary" className="h-8 gap-1" onClick={add}>
            <Plus className="size-3.5" /> Bill
          </Button>
        </div>
      </Card>
    </section>
  );
};
