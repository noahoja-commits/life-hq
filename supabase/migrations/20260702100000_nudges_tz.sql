-- Daily nudges for routines and trackers (user-local wall-clock time; each
-- push device stores its IANA timezone so the 15-min sweep can compute the
-- user's local time). Backfill of Management-API changes; idempotent.
alter table public.routines add column if not exists remind_time time;
alter table public.trackers add column if not exists remind_time time;
alter table public.push_subscriptions add column if not exists tz text;
