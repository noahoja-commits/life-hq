create table if not exists public.user_prefs (
  id bigint generated always as identity primary key,
  sales_id bigint unique references public.sales(id) on delete cascade,
  prefs jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_prefs enable row level security;
drop policy if exists user_prefs_all_own on public.user_prefs;
create policy user_prefs_all_own on public.user_prefs
  for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
grant all on public.user_prefs to authenticated;
notify pgrst, 'reload schema';
