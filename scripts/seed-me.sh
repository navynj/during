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

  today := (now() at time zone tz)::date;
  yesterday := today - 1;

  -- Deterministic ids: same slug, same row, so this is a refresh not a pile-up.
  insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, planned)
  values
    (md5(me::text || ':focus-am')::uuid,   me, focus,     'spec rewrite',                           today, '09:00', (today + time '10:30') at time zone tz, false),
    (md5(me::text || ':place-noon')::uuid, me, place,     'kitsilano beach',                        today, '12:15', (today + time '12:15') at time zone tz, false),
    (md5(me::text || ':listening')::uuid,  me, listening, 'parannoul on repeat',                    today, '14:40', (today + time '14:40') at time zone tz, false),
    (md5(me::text || ':locked')::uuid,     me, day,       'the thing I am not saying out loud yet', today, '16:00', (today + time '16:00') at time zone tz, false),
    -- In progress: no end. Late in the day, so the live record is the most
    -- recent one on the axis rather than the first.
    (md5(me::text || ':live')::uuid,       me, focus,     'session 2',                              today, '18:16', null, false),
    (md5(me::text || ':planned')::uuid,    me, place,     'dinner later',                           today, '21:30', (today + time '21:30') at time zone tz, true),
    (md5(me::text || ':note')::uuid,       me, day,       'slept badly, worked anyway',             today, null, null, false),
    (md5(me::text || ':y-focus')::uuid,    me, focus,     'schema, first pass',                     yesterday, '13:00', (yesterday + time '15:00') at time zone tz, false),
    (md5(me::text || ':y-song')::uuid,     me, listening, 'that one song again',                    yesterday, '20:10', (yesterday + time '20:10') at time zone tz, false),
    (md5(me::text || ':y-note')::uuid,     me, day,       'quiet one',                              yesterday, null, null, false),
    (md5(me::text || ':old')::uuid,        me, day,       'further back, deeper water',             today - 9, '18:00', (today - 9 + time '18:00') at time zone tz, false)
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
