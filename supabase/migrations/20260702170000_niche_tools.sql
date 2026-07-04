create table if not exists public.call_logs (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  application_id bigint references public.applications(id) on delete set null,
  who text default '',
  outcome text not null default 'no_answer',
  note text default '',
  called_at timestamptz not null default now()
);
create table if not exists public.waiting_items (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  text text not null,
  who text default '',
  since date not null default current_date,
  nudge_after_days int not null default 5,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.things (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  item text not null,
  location text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.call_logs enable row level security;
alter table public.waiting_items enable row level security;
alter table public.things enable row level security;
drop policy if exists call_logs_all_own on public.call_logs;
create policy call_logs_all_own on public.call_logs for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
drop policy if exists waiting_items_all_own on public.waiting_items;
create policy waiting_items_all_own on public.waiting_items for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
drop policy if exists things_all_own on public.things;
create policy things_all_own on public.things for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
grant all on public.call_logs to authenticated;
grant all on public.waiting_items to authenticated;
grant all on public.things to authenticated;
notify pgrst, 'reload schema';
