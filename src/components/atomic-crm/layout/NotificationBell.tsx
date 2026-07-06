import { useState } from "react";
import { useGetList } from "ra-core";
import { Bell, CheckSquare, Rocket, Target, Wallet, Phone, FileText, Link, Activity, CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: string;
  date: string;
  company_id?: number;
  sales_id?: number;
}

const TYPE_ICON: Record<string, typeof Activity> = {
  "company.created": Activity,
  "contact.created": Activity,
  "contactNote.created": FileText,
  "deal.created": Activity,
  "dealNote.created": FileText,
  "todo.created": CheckSquare,
  "todo.completed": CheckSquare,
  "focus.completed": Sparkles,
  "venture.created": Rocket,
  "application.created": Activity,
  "goal.created": Target,
  "routine.checked": CalendarCheck,
  "tracker.logged": Activity,
  "transaction.created": Wallet,
  "call.logged": Phone,
  "page.created": FileText,
  "link.created": Link,
};

const TYPE_LABEL: Record<string, string> = {
  "company.created": "Company added",
  "contact.created": "Contact added",
  "contactNote.created": "Note added",
  "deal.created": "Project created",
  "dealNote.created": "Note added",
  "todo.created": "To-do added",
  "todo.completed": "To-do completed",
  "focus.completed": "Focus session done",
  "venture.created": "Venture started",
  "application.created": "Job tracked",
  "goal.created": "Goal set",
  "routine.checked": "Routine checked",
  "tracker.logged": "Tracker logged",
  "transaction.created": "Transaction recorded",
  "call.logged": "Call logged",
  "page.created": "Page created",
  "link.created": "Connection made",
};

const relativeTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const { data, isPending } = useGetList<ActivityItem>("activity_log", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "date", order: "DESC" },
  });

  const items = data ?? [];
  const unread = items.length; // simple count — all are "unread" for now

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h4 className="text-sm font-semibold">Recent Activity</h4>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isPending ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No recent activity
            </div>
          ) : (
            items.map((item) => {
              const Icon = TYPE_ICON[item.type] || Activity;
              const label = TYPE_LABEL[item.type] || item.type;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 border-b border-border/50 px-4 py-2.5 last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {relativeTime(item.date)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
