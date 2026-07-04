-- Link to-dos to Ventures and Job applications (project_id -> deals already
-- exists from 20260630250000). Deleting the parent keeps the to-do (SET NULL).
alter table public.todos add column if not exists venture_id bigint references public.ventures(id) on delete set null;
alter table public.todos add column if not exists application_id bigint references public.applications(id) on delete set null;

create index if not exists todos_venture on public.todos (venture_id) where venture_id is not null;
create index if not exists todos_application on public.todos (application_id) where application_id is not null;
