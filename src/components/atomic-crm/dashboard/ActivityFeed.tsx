import { useGetList } from "ra-core";
import {
  Activity,
  Building2,
  CheckSquare,
  ClipboardList,
  FileCheck,
  FileText,
  Handshake,
  Link2,
  Phone,
  Rocket,
  Target,
  Timer,
  User,
  Wallet,
} from "lucide-react";

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  companies: Building2,
  contacts: User,
  notes: FileText,
  deals: Handshake,
  todos: CheckSquare,
  focus_sessions: Timer,
  ventures: Rocket,
  applications: FileCheck,
  goals: Target,
  routine_checks: Activity,
  log_entries: ClipboardList,
  transactions: Wallet,
  call_logs: Phone,
  pages: FileText,
  links: Link2,
};

const TYPE_LABEL: Record<string, string> = {
  companies: "Company",
  contacts: "Contact",
  notes: "Note",
  deals: "Deal",
  todos: "Todo",
  focus_sessions: "Focus",
  ventures: "Venture",
  applications: "Application",
  goals: "Goal",
  routine_checks: "Routine",
  log_entries: "Log",
  transactions: "Transaction",
  call_logs: "Call",
  pages: "Page",
  links: "Link",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getLabel(item: Record<string, unknown>): string {
  const typeLabel = TYPE_LABEL[item.type as string] || (item.type as string);
  const name =
    (item.name as string) ||
    (item.title as string) ||
    (item.subject as string) ||
    (item.label as string);
  if (name) return `${typeLabel}: ${name}`;
  return typeLabel;
}

export function ActivityFeed() {
  const { data, isPending } = useGetList("activity_log", {
    pagination: { page: 1, perPage: 20 },
    sort: { field: "date", order: "DESC" },
  });

  const items = (data ?? []) as Record<string, unknown>[];

  if (isPending) {
    return (
      <section>
        <h2 className="u-label text-muted-foreground mb-2">Recent Activity</h2>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-l-2 border-muted pl-3 animate-pulse"
            >
              <div className="size-4 mt-0.5 bg-muted rounded shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/4 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="u-label text-muted-foreground mb-2">Recent Activity</h2>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-[13px] text-muted-foreground">
          No recent activity
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y divide-border">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type as string] || Activity;
            const label = getLabel(item);
            const time = relativeTime(item.date as string);
            return (
              <div
                key={item.id as number}
                className="flex items-start gap-3 py-2 border-l-2 border-muted pl-3 mx-3 first:mt-2 last:mb-2"
              >
                <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{label}</p>
                  <p className="text-xs text-muted-foreground">{time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
