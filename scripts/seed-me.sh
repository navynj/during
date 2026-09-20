#!/usr/bin/env bash
# Puts the demo fixture on a real signed-in account, dated relative to that
# account's own today.
#
# supabase/seed.sql populates yoonji@during.today, but you sign in as yourself
# through Google, so your Home starts empty and there is nothing to judge a
# design against.
#
# Safe to run on an account you are actually using. Row ids derive from your
# user id, so re-running refreshes the fixture rather than duplicating it, and
# a fixture row whose time is already occupied by one of your own records is
# SKIPPED rather than forced — H10 makes the timeline exclusive, and your real
# day outranks the demo.
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
  row_spec record;
  parent_id uuid;
  seeded int := 0;
  skipped int := 0;
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

  -- Today is anchored to the clock rather than written as fixed hours, so the
  -- live record is both the most recent thing on the axis and long enough to
  -- have a bundle worth watching, at whatever hour this is run.
  --
  -- Minutes throughout: in Postgres `interval '-2 hours 30 minutes'` is -1h30,
  -- because the sign binds only to the first field.
  for row_spec in
    select *
      from (values
        ('focus-am',   focus,     'spec rewrite',                           interval '-240 minutes', interval '-150 minutes', false),
        ('place-noon', place,     'kitsilano beach',                        interval '-120 minutes', interval '-120 minutes', false),
        ('locked',     day,       'the thing I am not saying out loud yet', interval '-75 minutes',  interval '-75 minutes',  false),
        ('live',       focus,     'session 2',                              interval '-50 minutes',  null,                    false),
        ('planned',    place,     'dinner later',                           interval '300 minutes',  interval '300 minutes',  true)
      ) as v(slug, category, note, starts, ends, planned)
  loop
    begin
      insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, planned)
      values (
        md5(me::text || ':' || row_spec.slug)::uuid, me, row_spec.category, row_spec.note,
        (local_now + row_spec.starts)::date,
        (local_now + row_spec.starts)::time,
        case when row_spec.ends is null then null else (local_now + row_spec.ends) at time zone tz end,
        row_spec.planned
      )
      on conflict (id) do update
         set occurred_on   = excluded.occurred_on,
             occurred_time = excluded.occurred_time,
             ended_at      = excluded.ended_at,
             planned       = excluded.planned;
      seeded := seeded + 1;
    exception
      -- Your own day owns that stretch. The fixture yields; it is a demo.
      when exclusion_violation then
        skipped := skipped + 1;
    end;
  end loop;

  -- An inner ripple (H10): a drop that happened *during* the focus session.
  -- Only if that session is actually there — it may have been skipped.
  select id into parent_id from public.ripples
   where id = md5(me::text || ':focus-am')::uuid;

  if parent_id is not null then
    begin
      insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, parent_ripple_id)
      select md5(me::text || ':inner')::uuid, me, listening, 'something instrumental, to keep going',
             (local_now - interval '200 minutes')::date,
             (local_now - interval '200 minutes')::time,
             (local_now - interval '200 minutes') at time zone tz,
             parent_id
      on conflict (id) do update
         set occurred_on   = excluded.occurred_on,
             occurred_time = excluded.occurred_time,
             ended_at      = excluded.ended_at;
      seeded := seeded + 1;
    exception
      when others then
        skipped := skipped + 1;
    end;
  end if;

  -- Fixed-hour rows: a date-only note, yesterday, and one far enough back to
  -- show a quiet day.
  for row_spec in
    select *
      from (values
        ('note',    day,       'slept badly, worked anyway', today,     null::time,      null::time),
        -- Yesterday's session is a span, not a point: ends two hours later.
        ('y-focus', focus,     'schema, first pass',         yesterday, '13:00'::time,   '15:00'::time),
        ('y-song',  listening, 'that one song again',        yesterday, '20:10'::time,   '20:10'::time),
        ('y-note',  day,       'quiet one',                  yesterday, null::time,      null::time),
        ('old',     day,       'further back, deeper water', today - 9, '18:00'::time,   '18:00'::time)
      ) as v(slug, category, note, on_day, at_time, end_time)
  loop
    begin
      insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at)
      values (
        md5(me::text || ':' || row_spec.slug)::uuid, me, row_spec.category, row_spec.note,
        row_spec.on_day, row_spec.at_time,
        case when row_spec.end_time is null then null
             else (row_spec.on_day + row_spec.end_time) at time zone tz end
      )
      on conflict (id) do update
         set occurred_on   = excluded.occurred_on,
             occurred_time = excluded.occurred_time,
             ended_at      = excluded.ended_at;
      seeded := seeded + 1;
    exception
      when exclusion_violation then
        skipped := skipped + 1;
    end;
  end loop;

  -- One locked Ripple, if its row made it in.
  insert into public.ripple_audience (ripple_id, target_type)
  select md5(me::text || ':locked')::uuid, 'lock'
   where exists (select 1 from public.ripples where id = md5(me::text || ':locked')::uuid)
  on conflict do nothing;

  if skipped > 0 then
    raise notice 'Seeded % fixture ripples for % (timezone %). Skipped %: your own records already own those times, and the timeline is exclusive (H10).',
      seeded, target_email, tz, skipped;
  else
    raise notice 'Seeded % fixture ripples for % (timezone %, today %).', seeded, target_email, tz, today;
  end if;
end $$;
SQL
