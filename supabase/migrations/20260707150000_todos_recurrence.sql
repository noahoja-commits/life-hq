-- Recurring todos — daily, weekly, monthly
alter table public.todos add column if not exists recur_freq text;
alter table public.todos add column if not exists recur_byweekday int[] default null;
alter table public.todos add column if not exists recur_day_of_month int default null;
alter table public.todos add column if not exists recur_until date default null;
alter table public.todos add column if not exists remind_at timestamp with time zone default null;
alter table public.todos add column if not exists venture_id bigint references public.ventures(id) on delete set null;
alter table public.todos add column if not exists application_id bigint references public.applications(id) on delete set null;
notify pgrst, 'reload schema';
