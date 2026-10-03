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
# nothing here touches a record it did not make. Lanes are looked up by the
# preset names (H20i); an account still carrying the old preset gets the
# missing lanes added, never renamed.
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
  place uuid; mood uuid; music uuid; media uuid; food uuid; day uuid;
  whistler uuid; redesign uuid;
  row_spec record;
  seeded int := 0;
begin
  select p.id, p.timezone into me, tz
    from public.profiles p
    join auth.users u on u.id = p.id
   where u.email = target_email;

  if me is null then
    raise exception 'No profile for %. Sign in once first, then re-run.', target_email;
  end if;

  today := (now() at time zone tz)::date;

  -- The six-lane preset, added where missing. Existing lanes are left alone.
  for row_spec in
    select * from (values ('Place','📍',0),('Mood','🌤️',1),('Music','🎧',2),('Media','🎬',3),('Food','🍜',4),('Day','🖋',5))
      as v(name, icon, pos)
  loop
    insert into public.my_categories (user_id, name, icon, position)
    values (me, row_spec.name, row_spec.icon, row_spec.pos)
    on conflict (user_id, name) do nothing;
  end loop;

  select id into place from public.my_categories where user_id = me and name = 'Place';
  select id into mood  from public.my_categories where user_id = me and name = 'Mood';
  select id into music from public.my_categories where user_id = me and name = 'Music';
  select id into media from public.my_categories where user_id = me and name = 'Media';
  select id into food  from public.my_categories where user_id = me and name = 'Food';
  select id into day   from public.my_categories where user_id = me and name = 'Day';

  -- Two posts (H21a): one with a declared lane and range, one with a declared
  -- lane whose blocks took another lane too (tags, H21f).
  whistler := md5(me::text || ':splash-whistler')::uuid;
  redesign := md5(me::text || ':splash-redesign')::uuid;

  insert into public.splashes (id, owner_id, title, declared_start, declared_end, declared_lane_id, created_at)
  values
    (whistler, me, 'Whistler, two nights', today - 40, today - 37, place, (today - 41) + time '09:00'),
    (redesign, me, 'During redesign', null, null, day, (today - 26) + time '09:00')
  on conflict (id) do update
     set title = excluded.title, declared_start = excluded.declared_start,
         declared_end = excluded.declared_end, declared_lane_id = excluded.declared_lane_id;

  -- `on_day`: days back for the occurred annotation (null = unannotated).
  -- `made`: days back for created_at. Ends are same-day times.
  for row_spec in
    select *
      from (values
        -- Whistler: placed fragments inside the declared range, in its lane.
        ('w1', place, 'sea to sky, fog the whole way up',   40, '11:30'::time, null::time, 40, interval '11 hours 30 minutes', whistler),
        ('w2', place, 'the village at night, empty',        40, '21:15',       null,       40, interval '21 hours 15 minutes', whistler),
        ('w3', place, 'peak chair',                         39, '10:05',       null,       39, interval '10 hours 5 minutes',  whistler),
        ('w4', place, 'last coffee before the drive',       37, '08:40',       null,       37, interval '8 hours 40 minutes',  whistler),
        -- Redesign: across two months, plus a backfill made today, placed last month.
        ('r1', media, 'watched the whole dogfood month back as one scroll', null, null, null, 25, interval '20 hours', redesign),
        ('r2', day,   'the record is a fragment, not a timesheet',          null, null, null, 12, interval '9 hours 30 minutes', redesign),
        ('r3', day,   'two modes, one scroll',                               null, null, null, 2,  interval '14 hours', redesign),
        ('r4', day,   'the sketch that started it, found in a notebook',    35,   null, null, 0,  interval '8 hours', redesign),
        -- Loose fragments.
        ('l1', place, 'kitsilano beach',                        null, null, null, 0, interval '12 hours 15 minutes', null),
        ('l2', music, 'parannoul on repeat',                    null, null, null, 0, interval '14 hours 40 minutes', null),
        ('locked', day, 'the thing I am not saying out loud yet', null, null, null, 0, interval '16 hours', null),
        ('note', mood, 'slept badly, worked anyway',            0,    null, null, 0, interval '7 hours', null),
        -- A manual span and one overlapping it: both legal (H20c).
        ('span', food, 'dinner at the long table',              1, '19:00', '21:00', 1, interval '22 hours', null),
        ('call', place, 'call from mom, halfway through',       1, '19:40', '20:05', 1, interval '22 hours 5 minutes', null),
        ('song', music, 'that one song again',                  null, null, null, 1, interval '20 hours 10 minutes', null),
        -- Future-dated: a normal fragment with a future date chip.
        ('plan', food, 'dinner with mina',                     -3, '19:30', null, 0, interval '15 hours', null),
        ('old',  day,  'further back, deeper water',           null, null, null, 9, interval '18 hours', null)
      ) as v(slug, category, note, on_day, at_time, end_time, made, wrote, splash)
  loop
    insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, splash_id, created_at)
    values (
      md5(me::text || ':' || row_spec.slug)::uuid, me, row_spec.category, row_spec.note,
      case when row_spec.on_day is null then null else today - row_spec.on_day end,
      row_spec.at_time,
      case when row_spec.at_time is null then null
           else (today - row_spec.on_day + coalesce(row_spec.end_time, row_spec.at_time)) at time zone tz end,
      row_spec.splash,
      (today - row_spec.made) at time zone tz + row_spec.wrote
    )
    on conflict (id) do update
       set note          = excluded.note,
           category_id   = excluded.category_id,
           occurred_on   = excluded.occurred_on,
           occurred_time = excluded.occurred_time,
           ended_at      = excluded.ended_at,
           splash_id     = excluded.splash_id,
           created_at    = excluded.created_at;
    seeded := seeded + 1;
  end loop;

  insert into public.ripple_audience (ripple_id, target_type)
  values (md5(me::text || ':locked')::uuid, 'lock')
  on conflict do nothing;

  raise notice 'Seeded % fixture ripples and 2 splashes for % (timezone %, today %).', seeded, target_email, tz, today;
end $$;
SQL
