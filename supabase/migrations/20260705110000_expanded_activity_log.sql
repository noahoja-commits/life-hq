-- Expanded activity log — the hive-mind timeline.
-- Every entity type feeds into a single unified feed.
-- Drop and recreate since we can't ALTER a view with UNIONs easily.

drop view if exists public.activity_log cascade;

create or replace view public.activity_log with (security_invoker = on) as

-- Companies
select ('company.' || c.id || '.created') as id, 'company.created' as type, c.created_at as date,
  c.id as company_id, c.sales_id, to_json(c.*) as company,
  null::json as contact, null::json as deal, null::json as contact_note, null::json as deal_note,
  null::json as todo, null::json as venture, null::json as application, null::json as goal,
  null::json as routine_check, null::json as tracker_log, null::json as transaction,
  null::json as call_log, null::json as page
from public.companies c

union all
-- Contacts
select ('contact.' || co.id || '.created'), 'contact.created', co.first_seen,
  co.company_id, co.sales_id, null, to_json(co.*), null, null, null,
  null, null, null, null, null, null, null, null, null
from public.contacts co

union all
-- Contact notes
select ('contactNote.' || cn.id || '.created'), 'contactNote.created', cn.date,
  co.company_id, cn.sales_id, null, null, null, to_json(cn.*), null,
  null, null, null, null, null, null, null, null, null
from public.contact_notes cn left join public.contacts co on co.id = cn.contact_id

union all
-- Deals / Projects
select ('deal.' || d.id || '.created'), 'deal.created', d.created_at,
  d.company_id, d.sales_id, null, null, to_json(d.*), null, null,
  null, null, null, null, null, null, null, null, null
from public.deals d

union all
-- Deal notes
select ('dealNote.' || dn.id || '.created'), 'dealNote.created', dn.date,
  d.company_id, dn.sales_id, null, null, null, null, to_json(dn.*),
  null, null, null, null, null, null, null, null, null
from public.deal_notes dn left join public.deals d on d.id = dn.deal_id

union all
-- Todos (created)
select ('todo.' || t.id || '.created'), 'todo.created', t.created_at,
  null, t.sales_id, null, null, null, null, null,
  to_json(t.*), null, null, null, null, null, null, null, null
from public.todos t

union all
-- Todos (completed)
select ('todo.' || t.id || '.done'), 'todo.completed', t.done_at,
  null, t.sales_id, null, null, null, null, null,
  to_json(t.*), null, null, null, null, null, null, null, null
from public.todos t where t.done = true and t.done_at is not null

union all
-- Focus sessions
select ('focus.' || f.id || '.created'), 'focus.completed', f.started_at,
  null, f.sales_id, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null
from public.focus_sessions f where f.completed = true

union all
-- Ventures
select ('venture.' || v.id || '.created'), 'venture.created', v.created_at,
  null, v.sales_id, null, null, null, null, null,
  null, to_json(v.*), null, null, null, null, null, null, null
from public.ventures v

union all
-- Applications
select ('app.' || a.id || '.created'), 'application.created', a.created_at,
  null, a.sales_id, null, null, null, null, null,
  null, null, to_json(a.*), null, null, null, null, null, null
from public.applications a

union all
-- Goals
select ('goal.' || g.id || '.created'), 'goal.created', g.created_at,
  null, g.sales_id, null, null, null, null, null,
  null, null, null, to_json(g.*), null, null, null, null, null
from public.goals g

union all
-- Routine checks (completed routines for the day)
select ('routine.' || rc.id || '.created'), 'routine.checked', rc.checked_on,
  null, rc.sales_id, null, null, null, null, null,
  null, null, null, null, to_json(rc.*), null, null, null, null
from public.routine_checks rc

union all
-- Tracker log entries
select ('tracker.' || le.id || '.created'), 'tracker.logged', le.logged_at,
  null, le.sales_id, null, null, null, null, null,
  null, null, null, null, null, to_json(le.*), null, null, null
from public.log_entries le

union all
-- Transactions (money)
select ('txn.' || txn.id || '.created'), 'transaction.created', txn.created_at,
  null, txn.sales_id, null, null, null, null, null,
  null, null, null, null, null, null, to_json(txn.*), null, null
from public.transactions txn

union all
-- Call logs
select ('call.' || cl.id || '.created'), 'call.logged', cl.called_at,
  null, cl.sales_id, null, null, null, null, null,
  null, null, null, null, null, null, null, to_json(cl.*), null
from public.call_logs cl

union all
-- Pages
select ('page.' || p.id || '.created'), 'page.created', p.created_at,
  null, p.sales_id, null, null, null, null, null,
  null, null, null, null, null, null, null, null, to_json(p.*)
from public.pages p

-- Links (connections being made)
union all
select ('link.' || l.id || '.created'), 'link.created', l.created_at,
  null, l.sales_id, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null
from public.links l;
