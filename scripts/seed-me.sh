#!/usr/bin/env bash
# Puts the seed fixture on a real signed-in account, dated relative to that
# account's own today.
#
# supabase/seed.sql populates yoonji@during.today, but you sign in as yourself
# through Google, so your Home is empty and there is nothing to judge a design
# against. Idempotent: row ids are derived from your user id, so re-running
# refreshes the times instead of piling up duplicates.
#
#   pnpm seed:me you@example.com
set -euo pipefail

EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then
  echo "usage: pnpm seed:me <email>   (the address you signed in with)" >&2
  exit 1
fi

CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_during}"

docker exec -i "$CONTAINER" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 -v email="$EMAIL" <<'SQL'
-- psql does not substitute variables inside a dollar-quoted block, so the
-- address is handed to the block through a setting instead.
select set_config('during.seed_email', :'email', false);

do $$
declare
  target_email text := current_setting('during.seed_email');
  me uuid;
  tz text;
  local_now timestamp;
  today date;
  yesterday date;
  focus uuid; place uuid; listening uuid; day uuid;
begin
  select p.id, p.timezone into me, tz
    from public.profiles p
    join auth.users u on u.id = p.id
   where u.email = target_email;

  if me is null then
    raise exception 'No profile for %. Sign in once first, then re-run.', target_email;
  end if;

  select id into focus     from public.my_categories where user_id = me and name = 'Focus';
  select id into place     from public.my_categories where user_id = me and name = 'Place';
  select id into listening from public.my_categories where user_id = me and name = 'Listening';
  select id into day       from public.my_categories where user_id = me and name = 'Day';

  if focus is null or place is null or listening is null or day is null then
    raise exception 'Preset categories missing for %.', target_email;
  end if;

  local_now := now() at time zone tz;
  today := local_now::date;
  yesterday := today - 1;

  -- Deterministic ids: same slug, same row, so this is a refresh not a pile-up.
  --
  -- Today is anchored to the clock rather than written as fixed hours. A live
  -- record has to be both the most recent thing on the axis and long enough to
  -- have a bundle worth watching, and fixed hours can only satisfy one of
  -- those: 18:00 is last but has not started, 07:00 has run a while but sits
  -- at the top. Offsets from now satisfy both, at any hour the script is run.
  insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, planned)
  select md5(me::text || ':' || v.slug)::uuid, me, v.category, v.note,
         (local_now + v.starts)::date,
         (local_now + v.starts)::time,
         case when v.ends is null then null else (local_now + v.ends) at time zone tz end,
         v.planned
    from (values
      -- Minutes throughout: in Postgres `interval '-2 hours 30 minutes'` is
      -- -1h30, because the sign binds only to the first field. That silently
      -- turned a 90-minute record into a 150-minute one here.
      ('focus-am',   focus,     'spec rewrite',                           interval '-240 minutes', interval '-150 minutes', false),
      ('place-noon', place,     'kitsilano beach',                        interval '-180 minutes', interval '-180 minutes', false),
      ('listening',  listening, 'parannoul on repeat',                    interval '-120 minutes', interval '-120 minutes', false),
      ('locked',     day,       'the thing I am not saying out loud yet', interval '-75 minutes',  interval '-75 minutes',  false),
      -- In progress: no end, and started long enough ago to carry five lines.
      ('live',       focus,     'session 2',                              interval '-50 minutes',  null,                    false),
      ('planned',    place,     'dinner later',                           interval '300 minutes',  interval '300 minutes',  true)
    ) as v(slug, category, note, starts, ends, planned)
  on conflict (id) do update
     set occurred_on   = excluded.occurred_on,
         occurred_time = excluded.occurred_time,
         ended_at      = excluded.ended_at,
         planned       = excluded.planned;

  -- Fixed-hour rows: a date-only note, yesterday, and one far enough back to
  -- show the surface at its deepest step.
  insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, planned)
  values
    (md5(me::text || ':note')::uuid,    me, day,       'slept badly, worked anyway', today,     null,    null, false),
    (md5(me::text || ':y-focus')::uuid, me, focus,     'schema, first pass',         yesterday, '13:00', (yesterday + time '15:00') at time zone tz, false),
    (md5(me::text || ':y-song')::uuid,  me, listening, 'that one song again',        yesterday, '20:10', (yesterday + time '20:10') at time zone tz, false),
    (md5(me::text || ':y-note')::uuid,  me, day,       'quiet one',                  yesterday, null,    null, false),
    (md5(me::text || ':old')::uuid,     me, day,       'further back, deeper water', today - 9, '18:00', (today - 9 + time '18:00') at time zone tz, false)
  on conflict (id) do update
     set occurred_on   = excluded.occurred_on,
         occurred_time = excluded.occurred_time,
         ended_at      = excluded.ended_at,
         planned       = excluded.planned;

  -- One locked Ripple, so the timeline shows it unmarked (SPEC: my own view).
  insert into public.ripple_audience (ripple_id, target_type)
  values (md5(me::text || ':locked')::uuid, 'lock')
  on conflict do nothing;

  raise notice 'Seeded 11 ripples for % (timezone %, today %).', target_email, tz, today;
end $$;
SQL
