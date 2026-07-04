-- Job applications pipeline ("Jobs" section).
-- Backfill: this table was originally created directly on the remote via the
-- Management API; this migration makes the schema reproducible. Idempotent so
-- pushing against the already-provisioned remote is a no-op.
create table if not exists public.applications (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  company text not null,
  role text default '',
  url text default '',
  status text not null default 'wishlist',
  location text default '',
  salary text default '',
  follow_up_date date,
  notes text default '',
  position integer default 0,
  created_at timestamptz not null default now()
);

alter table public.applications enable row level security;

drop policy if exists applications_all_own on public.applications;
create policy applications_all_own on public.applications
  for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));

grant all on public.applications to authenticated;

create index if not exists applications_sales_status_followup
  on public.applications (sales_id, status, follow_up_date);
