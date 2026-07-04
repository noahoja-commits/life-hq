create table if not exists public.pages (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  title text not null default 'Untitled',
  emoji text default '',
  kind text not null default 'doc',
  content jsonb not null default '{}',
  theme jsonb not null default '{}',
  position integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pages enable row level security;
drop policy if exists pages_all_own on public.pages;
create policy pages_all_own on public.pages
  for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
grant all on public.pages to authenticated;
create index if not exists pages_sales on public.pages (sales_id, position);
notify pgrst, 'reload schema';
