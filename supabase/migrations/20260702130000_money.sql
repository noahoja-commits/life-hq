create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  amount numeric not null,
  kind text not null default 'expense',
  category text not null default 'Other',
  note text default '',
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
create table if not exists public.bills (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  due_day int not null default 1,
  category text default 'Bills',
  autopay boolean not null default false,
  active boolean not null default true,
  last_paid_on date,
  created_at timestamptz not null default now()
);
create table if not exists public.budgets (
  id bigint generated always as identity primary key,
  sales_id bigint references public.sales(id) on delete cascade,
  category text not null,
  monthly numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (sales_id, category)
);
alter table public.transactions enable row level security;
alter table public.bills enable row level security;
alter table public.budgets enable row level security;
drop policy if exists transactions_all_own on public.transactions;
create policy transactions_all_own on public.transactions for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
drop policy if exists bills_all_own on public.bills;
create policy bills_all_own on public.bills for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
drop policy if exists budgets_all_own on public.budgets;
create policy budgets_all_own on public.budgets for all
  using (sales_id in (select sales.id from sales where sales.user_id = auth.uid()))
  with check (sales_id in (select sales.id from sales where sales.user_id = auth.uid()));
grant all on public.transactions to authenticated;
grant all on public.bills to authenticated;
grant all on public.budgets to authenticated;
create index if not exists transactions_sales_date on public.transactions (sales_id, occurred_on desc);
notify pgrst, 'reload schema';
