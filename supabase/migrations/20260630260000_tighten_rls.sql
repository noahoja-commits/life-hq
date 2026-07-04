-- Security: drop the permissive "sales_id is null" disjunct from every custom
-- table's RLS USING clause. Rows are now strictly owner-scoped.

alter policy "hub_items_select_own" on public.hub_items
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "trackers_all_own" on public.trackers
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "lists_all_own" on public.lists
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "list_items_all_own" on public.list_items
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "routines_all_own" on public.routines
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "routine_steps_all_own" on public.routine_steps
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "ventures_all_own" on public.ventures
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "todos_all_own" on public.todos
    using (sales_id in (select id from public.sales where user_id = auth.uid()));

alter policy "focus_sessions_all_own" on public.focus_sessions
    using (sales_id in (select id from public.sales where user_id = auth.uid()));
