-- Demo fixture. Two linked accounts in the two timezones During is actually
-- used in, plus a third linked account that has gone quiet. Yoonji's day is
-- the Splash pivot's fixture (H20): two boards and loose fragments across
-- two months.
--
-- Dates are relative to each author's own today, so the seed stays meaningful
-- whenever it is run and Home has something to render on first sign-in.

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

-- The empty-string token columns are not decoration: GoTrue scans them into
-- non-nullable Go strings and fails to find the user if they are null, which
-- breaks every admin auth call against a seeded account.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token,
  reauthentication_token
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'yoonji@during.today', '', now(),
   '{"provider":"google","providers":["google"]}',
   '{"full_name":"Yoonji"}', now() - interval '30 days', now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'mina@during.today', '', now(),
   '{"provider":"google","providers":["google"]}',
   '{"full_name":"Mina"}', now() - interval '30 days', now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'jae@during.today', '', now(),
   '{"provider":"google","providers":["google"]}',
   '{"full_name":"Jae"}', now() - interval '30 days', now(), '', '', '', '', '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id, id, id::text,
       jsonb_build_object('sub', id::text, 'email', email),
       'google', now(), now(), now()
  from auth.users
 where email like '%@during.today';

-- last_active_at drives presence (C7). Jae is past the hardcoded 3-day TTL and
-- must therefore be absent from friends strips entirely — no badge, no row.
insert into public.profiles (id, display_name, timezone, last_active_at)
values
  ('11111111-1111-1111-1111-111111111111', 'Yoonji', 'America/Vancouver', now()),
  ('22222222-2222-2222-2222-222222222222', 'Mina', 'Asia/Seoul', now() - interval '20 minutes'),
  ('33333333-3333-3333-3333-333333333333', 'Jae', 'America/Vancouver', now() - interval '5 days');

-- Links are stored in canonical order; both of Yoonji's are mutual by nature.
insert into public.links (user_a, user_b)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333');

-- ---------------------------------------------------------------------------
-- categories — the six-lane preset every new profile is seeded with (H20i)
-- ---------------------------------------------------------------------------

insert into public.my_categories (id, user_id, name, icon, default_mode, position)
values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Place', '📍', 'drop', 0),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Mood',  '🌤️', 'drop', 1),
  ('a1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Music', '🎧', 'drop', 2),
  ('a1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Media', '🎬', 'drop', 3),
  ('a1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Food',  '🍜', 'drop', 4),
  ('a1000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Day',   '🖋', 'drop', 5),
  ('a2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Place', '📍', 'drop', 0),
  ('a2000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Music', '🎧', 'drop', 2),
  ('a2000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Day',   '🖋', 'drop', 5),
  ('a3000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'Day',   '🖋', 'drop', 0);

-- ---------------------------------------------------------------------------
-- splashes — two boards (H20d): one with a declared lane, one without
-- ---------------------------------------------------------------------------

-- Dates are relative to today so both home modes, month sinking, lane
-- inheritance and backfill placement are visible whenever this is run.
with day as (select (now() at time zone 'America/Vancouver')::date as d)
insert into public.splashes (id, owner_id, title, declared_start, declared_end, lane_ids, created_at)
select v.id, '11111111-1111-1111-1111-111111111111', v.title,
       case when v.from_days is null then null else day.d - v.from_days end,
       case when v.to_days is null then null else day.d - v.to_days end,
       v.lanes, (day.d - v.made) + time '09:00'
  from day,
       (values
         -- Declared range and one declared lane: every fragment thrown in is
         -- a Place, and the sheet shows no category choice (H20e).
         ('c1000000-0000-0000-0000-000000000001'::uuid, 'Whistler, two nights',
          40, 37, array['a1000000-0000-0000-0000-000000000001'::uuid], 41),
         -- Nothing declared: range and chip are derived from what lands in it.
         ('c1000000-0000-0000-0000-000000000002', 'During redesign',
          null::int, null::int, '{}'::uuid[], 26)
       ) as v(id, title, from_days, to_days, lanes, made);

-- ---------------------------------------------------------------------------
-- ripples
--
-- Every shape the flow has to render (H20c): unannotated fragments flowing by
-- created_at, a date-only fragment, placed fragments, a manual span, two
-- overlapping spans (legal now), a future-dated fragment, a backfill created
-- this month but placed last month, splash members, loose fragments, locked.
-- ---------------------------------------------------------------------------

-- The Whistler board: four placed fragments inside its declared range, all in
-- its declared lane, made when they happened.
with day as (select (now() at time zone 'America/Vancouver')::date as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, splash_id, created_at)
select v.id, '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', v.note,
       day.d - v.ago, v.at, (day.d - v.ago + v.at) at time zone 'America/Vancouver',
       'c1000000-0000-0000-0000-000000000001',
       (day.d - v.ago + v.at) at time zone 'America/Vancouver'
  from day,
       (values
         ('b1000000-0000-0000-0000-000000000021'::uuid, 'sea to sky, fog the whole way up', 40, '11:30'::time),
         ('b1000000-0000-0000-0000-000000000022', 'the village at night, empty', 40, '21:15'),
         ('b1000000-0000-0000-0000-000000000023', 'peak chair', 39, '10:05'),
         ('b1000000-0000-0000-0000-000000000024', 'last coffee before the drive', 37, '08:40')
       ) as v(id, note, ago, at);

-- The redesign board: fragments across two months, plus one BACKFILL — made
-- today, placed last month — so its row sits in last month's section while
-- the diary remembers it was written now.
with day as (select (now() at time zone 'America/Vancouver')::date as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, splash_id, created_at)
select v.id, '11111111-1111-1111-1111-111111111111', v.category, v.note,
       case when v.placed is null then null else day.d - v.placed end,
       null, null,
       'c1000000-0000-0000-0000-000000000002',
       (day.d - v.made) at time zone 'America/Vancouver' + v.at
  from day,
       (values
         ('b1000000-0000-0000-0000-000000000031'::uuid, 'a1000000-0000-0000-0000-000000000004'::uuid,
          'watched the whole dogfood month back as one scroll', 25, null::int, interval '20 hours'),
         ('b1000000-0000-0000-0000-000000000032', 'a1000000-0000-0000-0000-000000000006',
          'the record is a fragment, not a timesheet', 12, null, interval '9 hours 30 minutes'),
         ('b1000000-0000-0000-0000-000000000033', 'a1000000-0000-0000-0000-000000000006',
          'two modes, one scroll', 2, null, interval '14 hours'),
         -- Backfill: created today, annotated 35 days ago.
         ('b1000000-0000-0000-0000-000000000034', 'a1000000-0000-0000-0000-000000000006',
          'the sketch that started it, found in a notebook', 0, 35, interval '8 hours')
       ) as v(id, category, note, made, placed, at);

-- Loose fragments, today and yesterday. `on_day` counts days back from today
-- (null = unannotated); `made` is when it was written.
with day as (select (now() at time zone 'America/Vancouver')::date as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, created_at)
select v.id, '11111111-1111-1111-1111-111111111111', v.category, v.note,
       case when v.on_day is null then null else day.d - v.on_day end,
       v.at,
       case when v.at is null then null
            else (day.d - v.on_day + coalesce(v.ends, v.at)) at time zone 'America/Vancouver' end,
       (day.d - v.made) at time zone 'America/Vancouver' + v.wrote
  from day,
       (values
         -- Unannotated: the default. They flow in posting order.
         ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000001'::uuid,
          'kitsilano beach', null::int, null::time, null::time, 0, interval '12 hours 15 minutes'),
         ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
          'parannoul on repeat', null, null, null, 0, interval '14 hours 40 minutes'),
         -- Locked: the audience row is added below.
         ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006',
          'the thing I am not saying out loud yet', null, null, null, 0, interval '16 hours'),
         -- Date-only: belongs to today, sorts at the day's end.
         ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002',
          'slept badly, worked anyway', 0, null, null, 0, interval '7 hours'),
         -- A manual span, and a second span overlapping it: both legal (H20c).
         ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000005',
          'dinner at the long table', 1, '19:00'::time, '21:00'::time, 1, interval '22 hours'),
         ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000001',
          'call from mom, halfway through', 1, '19:40', '20:05', 1, interval '22 hours 5 minutes'),
         ('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000003',
          'that one song again', null, null, null, 1, interval '20 hours 10 minutes'),
         -- Future-dated: a normal fragment with a future date chip.
         ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005',
          'dinner with mina', -3, '19:30', null, 0, interval '15 hours')
       ) as v(id, category, note, on_day, at, ends, made, wrote);

-- Mina, today in Seoul. Gives the friend rail something to sit at an hour
-- against, across a sixteen-hour offset from Yoonji's day.
with day as (select (now() at time zone 'Asia/Seoul')::date as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at)
select v.id, '22222222-2222-2222-2222-222222222222', v.category, v.note,
       case when v.today then day.d end, v.at,
       case when v.at is null then null else (day.d + v.at) at time zone 'Asia/Seoul' end
  from day,
       (values
         ('b2000000-0000-0000-0000-000000000001'::uuid, 'a2000000-0000-0000-0000-000000000001'::uuid,
          'seongsu, again', true, '11:20'::time),
         ('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000003',
          'thesis playlist, again', false, null),
         ('b2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000006',
          'rained all afternoon', true, null)
       ) as v(id, category, note, today, at);

-- Jae went quiet five days ago: a Ripple that persists (C7 — presence expires,
-- records do not) behind a profile that is past its TTL.
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at)
values (
  'b3000000-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  'a3000000-0000-0000-0000-000000000006',
  'see you when I see you',
  ((now() - interval '5 days') at time zone 'America/Vancouver')::date,
  '18:00',
  ((((now() - interval '5 days') at time zone 'America/Vancouver')::date + '18:00'::time)
    at time zone 'America/Vancouver')
);

-- ---------------------------------------------------------------------------
-- audience — one locked Ripple, the fixture the RLS test is written against
-- ---------------------------------------------------------------------------

insert into public.ripple_audience (ripple_id, target_type)
values ('b1000000-0000-0000-0000-000000000004', 'lock');

-- ---------------------------------------------------------------------------
-- witness — Mina has seen one of Yoonji's drops
-- ---------------------------------------------------------------------------

insert into public.ripple_views (ripple_id, viewer_id)
values ('b1000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222');

-- The trigger on ripples moved every profile's last_active_at to now(); put
-- the seeded presence back so Jae stays past his TTL.
update public.profiles set last_active_at = now() - interval '20 minutes'
 where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set last_active_at = now() - interval '5 days'
 where id = '33333333-3333-3333-3333-333333333333';
