-- Recurring todos — daily, weekly, monthly, yearly
alter table public.todos add column if not exists recurrence text;
alter table public.todos add column if not exists recurrence_end timestamptz;
alter table public.todos add column if not exists recurrence_next timestamptz;
create index if not exists todos_recurrence_next on public.todos (recurrence_next) where recurrence is not null;
notify pgrst, 'reload schema';
