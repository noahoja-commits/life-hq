-- Keep-in-touch: cadence per person, last time you reached out.
alter table public.contacts add column if not exists touch_cadence_days int;
alter table public.contacts add column if not exists last_touch_on date;

-- Recreate contacts_summary with the new columns appended (OR REPLACE allows
-- appending at the end only).
create or replace view public.contacts_summary as
 SELECT co.id,
    co.first_name,
    co.last_name,
    co.gender,
    co.title,
    co.background,
    co.avatar,
    co.first_seen,
    co.last_seen,
    co.has_newsletter,
    co.status,
    co.tags,
    co.company_id,
    co.sales_id,
    co.linkedin_url,
    co.email_jsonb,
    co.phone_jsonb,
    jsonb_path_query_array(co.email_jsonb, '$[*]."email"'::jsonpath)::text AS email_fts,
    jsonb_path_query_array(co.phone_jsonb, '$[*]."number"'::jsonpath)::text AS phone_fts,
    c.name AS company_name,
    count(DISTINCT t.id) FILTER (WHERE t.done_date IS NULL) AS nb_tasks,
    co.touch_cadence_days,
    co.last_touch_on
   FROM contacts co
     LEFT JOIN tasks t ON co.id = t.contact_id
     LEFT JOIN companies c ON co.company_id = c.id
  GROUP BY co.id, c.name;

notify pgrst, 'reload schema';
