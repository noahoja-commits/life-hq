create table if not exists public.goals (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  title text not null,
  emoji text default '',
  why text default '',
  target_date date,
  status text not null default 'active',
  color text,
  position integer default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.goal_milestones (
  id bigint generated always as identity primary key,
  goal_id bigint not null references public.goals(id) on delete cascade,
  sales_id bigint references public.sales(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position integer default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.life_dates (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  title text not null,
  emoji text default '',
  on_date date not null,
  repeat_yearly boolean not null default true,
  remind_days_before int not null default 3,
  created_at timestamptz not null default now()
);
create table if not exists public.balance_checks (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  checked_on date not null default current_date,
  scores jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.life_dates enable row level security;
alter table public.balance_checks enable row level security;
drop policy if exists goals_all_own on public.goals;
create policy goals_all_own on public.goals for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
drop policy if exists goal_milestones_all_own on public.goal_milestones;
create policy goal_milestones_all_own on public.goal_milestones for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
drop policy if exists life_dates_all_own on public.life_dates;
create policy life_dates_all_own on public.life_dates for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
drop policy if exists balance_checks_all_own on public.balance_checks;
create policy balance_checks_all_own on public.balance_checks for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
grant all on public.goals to authenticated;
grant all on public.goal_milestones to authenticated;
grant all on public.life_dates to authenticated;
grant all on public.balance_checks to authenticated;
notify pgrst, 'reload schema';
