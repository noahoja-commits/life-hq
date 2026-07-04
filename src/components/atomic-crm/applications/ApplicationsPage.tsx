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
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  DollarSign,
  Bell,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "../misc/useConfirm";
import { NextActions } from "../todos/NextActions";
import { CallLogSection, LogCallChips } from "./CallLog";
import { cn } from "@/lib/utils";

const STATUSES = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "closed",
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_META: Record<Status, { label: string; color: string }> = {
  wishlist: { label: "Wishlist", color: "#94a3b8" },
  applied: { label: "Applied", color: "#7dbde8" },
  interview: { label: "Interviewing", color: "#f59e0b" },
  offer: { label: "Offer", color: "#34d399" },
  closed: { label: "Closed", color: "#9ca3af" },
};

// Active-first order for display.
const ORDER: Status[] = ["interview", "applied", "wishlist", "offer", "closed"];

interface Application {
  id: number;
  company: string;
  role?: string;
  url?: string;
  status: Status;
  location?: string;
  salary?: string;
  follow_up_date?: string | null;
  notes?: string;
  position: number;
}

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const prettyDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export const ApplicationsPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const [addOpen, setAddOpen] = useState(false);
  const { confirm, confirmUI } = useConfirm();

  const { data, refetch, isPending } = useGetList<Application>("applications", {
    pagination: { page: 1, perPage: 300 },
    sort: { field: "position", order: "ASC" },
  });
  const salesId = identity?.id ? Number(identity.id) : null;
  const apps = data ?? [];
  const today = localToday();

  const patch = (a: Application, d: Partial<Application>) =>
    update(
      "applications",
      { id: a.id, data: d, previousData: a },
      { onSuccess: () => refetch() },
    );

  const del = (a: Application) =>
    remove("applications", { id: a.id, previousData: a }, { onSuccess: () => refetch() });

  const present = ORDER.filter((s) => apps.some((a) => a.status === s));

  // Summary counts for the header strip.
  const activeCount = apps.filter((a) => a.status !== "closed").length;
  const dueFollowUps = apps.filter(
    (a) =>
      a.follow_up_date &&
      a.follow_up_date <= today &&
      a.status !== "closed" &&
      a.status !== "offer",
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Jobs</h1>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" /> New application
        </Button>
      </div>

      <CallLogSection />

      {apps.length > 0 && (
        <div className="flex gap-2 mb-6 text-xs">
          <span className="rounded-full bg-primary/10 text-primary px-3 py-1">
            {activeCount} active
          </span>
          {dueFollowUps > 0 && (
            <span className="rounded-full bg-amber-500/15 text-amber-500 px-3 py-1 flex items-center gap-1">
              <Bell className="size-3" /> {dueFollowUps} follow-up
              {dueFollowUps > 1 ? "s" : ""} due
            </span>
          )}
        </div>
      )}

      {isPending && apps.length === 0 ? (
        <CardsSkeleton count={4} />
      ) : apps.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          No applications yet. Add the jobs you're chasing — track each from
          wishlist to offer, and never miss a follow-up.
        </Card>
      ) : (
        present.map((status) => (
          <section key={status} className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: STATUS_META[status].color }}
              />
              {STATUS_META[status].label}
              <span className="text-muted-foreground/60">
                · {apps.filter((a) => a.status === status).length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {apps
                .filter((a) => a.status === status)
                .map((a) => (
                  <AppCard
                    key={a.id}
                    a={a}
                    today={today}
                    onPatch={(d) => patch(a, d)}
                    onDelete={() =>
                      confirm(`Delete "${a.company}"?`, () => del(a))
                    }
                  />
                ))}
            </div>
          </section>
        ))
      )}

      {addOpen && (
        <AddApplicationDialog
          onClose={() => setAddOpen(false)}
          onAdd={(payload) =>
            create(
              "applications",
              { data: { ...payload, sales_id: salesId, position: apps.length } },
              {
                onSuccess: () => {
                  setAddOpen(false);
                  refetch();
                },
                onError: () => notify("Could not add application", { type: "error" }),
              },
            )
          }
        />
      )}
      {confirmUI}
    </div>
  );
};

ApplicationsPage.path = "/applications";

const AppCard = ({
  a,
  today,
  onPatch,
  onDelete,
}: {
  a: Application;
  today: string;
  onPatch: (d: Partial<Application>) => void;
  onDelete: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(a.notes ?? "");
  const hasNote = !!(a.notes && a.notes.trim());
  const followDue =
    a.follow_up_date &&
    a.follow_up_date <= today &&
    a.status !== "closed" &&
    a.status !== "offer";

  const saveNote = () => {
    const next = note.trim();
    if (next !== (a.notes ?? "").trim()) onPatch({ notes: next });
  };

  return (
    <Card
      className="p-4 flex flex-col gap-2 border-l-4"
      style={{ borderLeftColor: STATUS_META[a.status].color }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{a.company}</div>
          {a.role && (
            <div className="text-sm text-muted-foreground truncate">{a.role}</div>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label="Delete application"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {a.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {a.location}
          </span>
        )}
        {a.salary && (
          <span className="flex items-center gap-1">
            <DollarSign className="size-3" />
            {a.salary}
          </span>
        )}
        {a.follow_up_date && (
          <span
            className={cn(
              "flex items-center gap-1",
              followDue && "text-amber-500 font-medium",
            )}
          >
            <Bell className="size-3" />
            {followDue ? "Follow up " : "Follow-up "}
            {prettyDate(a.follow_up_date)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <Select value={a.status} onValueChange={(s) => onPatch({ status: s as Status })}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {a.url && (
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Open <ExternalLink className="size-3.5" />
          </a>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="ml-auto text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
        >
          {hasNote && !expanded && <StickyNote className="size-3" />}
          Details
          <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 pt-1">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="Notes — recruiter name, interview prep, next step…"
            className="min-h-16 text-sm resize-y"
          />
          <div className="flex items-center gap-2 text-xs">
            <label className="text-muted-foreground">Follow up</label>
            <input
              type="date"
              value={a.follow_up_date ?? ""}
              onChange={(e) => onPatch({ follow_up_date: e.target.value || null })}
              className="rounded-md border px-2 py-1 bg-transparent"
            />
          </div>
          <LogCallChips applicationId={a.id} company={a.company} />
          <NextActions filterField="application_id" refId={a.id} compact />
        </div>
      )}
    </Card>
  );
};

const AddApplicationDialog = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (payload: {
    company: string;
    role: string;
    status: Status;
    url: string;
    location: string;
    salary: string;
    follow_up_date: string | null;
    notes: string;
  }) => void;
}) => {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("applied");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New application</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="Company *"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <Input placeholder="Role / title" value={role} onChange={(e) => setRole(e.target.value)} />
          <Select value={status} onValueChange={(s) => setStatus(s as Status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <Input placeholder="Pay" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>
          <Input placeholder="Listing / apply link" value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="flex items-center gap-2 text-sm">
            <label className="text-muted-foreground shrink-0">Follow up on</label>
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="rounded-md border px-2 py-1 bg-transparent flex-1"
            />
          </div>
          <Textarea rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                company.trim() &&
                onAdd({
                  company: company.trim(),
                  role: role.trim(),
                  status,
                  url: url.trim()
                    ? /^https?:\/\//.test(url)
                      ? url.trim()
                      : `https://${url.trim()}`
                    : "",
                  location: location.trim(),
                  salary: salary.trim(),
                  follow_up_date: followUp || null,
                  notes: notes.trim(),
                })
              }
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
