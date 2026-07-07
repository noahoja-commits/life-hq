-- Add parent_id to pages for nested/sub-page support
alter table public.pages add column if not exists parent_id bigint references public.pages(id) on delete set null;
create index if not exists pages_parent on public.pages (sales_id, parent_id);
notify pgrst, 'reload schema';
