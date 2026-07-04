-- Timed per-item reminders + client-side recurrence + weekday-aware routines.
-- Backfill of changes originally applied via the Management API. Idempotent.

-- Reminders: exact-time push per to-do (swept every 15 min by pg_cron ->
-- send_reminders edge function, mode "timed").
alter table public.todos add column if not exists remind_at timestamptz;

-- Recurrence (materialize-on-complete, one open instance per series).
alter table public.todos add column if not exists recur_freq text;
alter table public.todos add column if not exists recur_byweekday int[];
alter table public.todos add column if not exists recur_day_of_month int;
alter table public.todos add column if not exists recur_until date;

-- Routines active on specific weekdays (0=Sun..6=Sat; default every day).
alter table public.routines add column if not exists active_days int[] default '{0,1,2,3,4,5,6}';

-- Dedup ledger: one push per (item, occurrence). Owner-scoped; the edge
-- function writes via service role.
create table if not exists public.notifications_log (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  ref_table text not null,
  ref_id bigint not null,
  occurrence_key text not null,
  sent_at timestamptz not null default now()
);

create unique index if not exists notifications_log_occurrence
  on public.notifications_log (sales_id, ref_table, ref_id, occurrence_key);

alter table public.notifications_log enable row level security;

drop policy if exists notifications_log_all_own on public.notifications_log;
create policy notifications_log_all_own on public.notifications_log
  for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));

grant all on public.notifications_log to authenticated;

create index if not exists todos_remind_scan
  on public.todos (remind_at) where done = false and remind_at is not null;
create index if not exists todos_sales_done_due
  on public.todos (sales_id, done, due_date);
