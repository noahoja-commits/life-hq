-- Universal polymorphic links — any entity can connect to any other.
-- This is the "hive mind" backbone. Every connection is bidirectional:
-- query WHERE source_type=X and source_id=Y to get all linked entities,
-- or WHERE target_type=X and target_id=Y to find things that point here.

create table if not exists public.links (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  source_type text not null,
  source_id bigint not null,
  target_type text not null,
  target_id bigint not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for "show me everything linked to this entity"
create index if not exists idx_links_source on public.links (source_type, source_id);
-- Index for "show me everything that points to this entity"
create index if not exists idx_links_target on public.links (target_type, target_id);
-- Index for "show me connections of a specific type"
create index if not exists idx_links_types on public.links (source_type, target_type);

-- Prevent self-links (an entity linking to itself)
alter table public.links add constraint links_no_self
  check (not (source_type = target_type and source_id = target_id));

-- Prevent duplicate links (same source→target pair)
create unique index if not exists uq_links_pair
  on public.links (source_type, source_id, target_type, target_id);

-- RLS: owners see their own links
alter table public.links enable row level security;

create policy "links_select_own" on public.links
  for select to authenticated
  using (sales_id in (select id from public.sales where user_id = auth.uid()));

create policy "links_insert_own" on public.links
  for insert to authenticated
  with check (sales_id in (select id from public.sales where user_id = auth.uid()));

create policy "links_update_own" on public.links
  for update to authenticated
  using (sales_id in (select id from public.sales where user_id = auth.uid()));

create policy "links_delete_own" on public.links
  for delete to authenticated
  using (sales_id in (select id from public.sales where user_id = auth.uid()));
