create table if not exists public.scripts (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  title text not null default 'Untitled script',
  emoji text default '',
  category text not null default 'General',
  body text not null default '',
  position integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.scripts enable row level security;
drop policy if exists scripts_all_own on public.scripts;
create policy scripts_all_own on public.scripts for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
grant all on public.scripts to authenticated;
notify pgrst, 'reload schema';
