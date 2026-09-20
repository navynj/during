-- Demo fixture. Two linked accounts in the two timezones During is actually
-- used in, plus a third linked account that has gone quiet.
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
-- categories — the same preset every new profile is seeded with
-- ---------------------------------------------------------------------------

insert into public.my_categories (id, user_id, name, icon, default_mode, position)
values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Focus', '🔍', 'timed', 0),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Place', '📍', 'drop', 1),
  ('a1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Listening', '🎧', 'drop', 2),
  ('a1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Day', '🖋', 'drop', 3),
  ('a2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Focus', '🔍', 'timed', 0),
  ('a2000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Place', '📍', 'drop', 1),
  ('a2000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Listening', '🎧', 'drop', 2),
  ('a2000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Day', '🖋', 'drop', 3),
  ('a3000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Day', '🖋', 'drop', 0);

-- ---------------------------------------------------------------------------
-- ripples
--
-- Every state the wave grammar has to render (S1) appears here at least once:
-- timed finished, timed in progress, drop, planned, date-only, locked.
-- ---------------------------------------------------------------------------

-- Yoonji, today in Vancouver.
with day as (select (now() at time zone 'America/Vancouver')::date as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, planned)
select v.id, '11111111-1111-1111-1111-111111111111', v.category, v.note, day.d, v.at,
       case
         when v.at is null then null                                   -- date-only
         when v.ends is null then null                                 -- in progress
         else (day.d + v.ends) at time zone 'America/Vancouver'
       end,
       v.planned
  from day,
       (values
         -- timed, finished: a bundle spanning ninety minutes
         ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000001'::uuid,
          'spec rewrite', '09:00'::time, '10:30'::time, false),
         -- drop: ended_at = start, the point-in-time encoding
         ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
          'kitsilano beach', '12:15', '12:15', false),
         ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
          'parannoul on repeat', '14:40', '14:40', false),
         -- locked: the audience row is added below
         ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
          'the thing I am not saying out loud yet', '16:00', '16:00', false),
         -- timed, in progress: its last wave line is the only thing that moves
         ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
          'session 0', '20:00', null, false),
         -- planned: dotted, reduced opacity, future
         ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002',
          'dinner with mina', '21:30', '21:30', true),
         -- date-only: belongs to the day without a position on its axis
         ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004',
          'slept badly, worked anyway', null, null, false)
       ) as v(id, category, note, at, ends, planned);

-- An inner ripple (H10): a drop that happened *during* the morning focus
-- session. Concurrency is containment, not overlap — this is a full Ripple
-- with its own category, so Locker still counts it, but it does not claim a
-- row on the top-level axis.
with day as (select (now() at time zone 'America/Vancouver')::date as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, parent_ripple_id)
select 'b1000000-0000-0000-0000-000000000008',
       '11111111-1111-1111-1111-111111111111',
       'a1000000-0000-0000-0000-000000000003',
       'something instrumental, to keep going',
       day.d, '09:40',
       (day.d + '09:40'::time) at time zone 'America/Vancouver',
       'b1000000-0000-0000-0000-000000000001'
  from day;

-- Yoonji, yesterday in Vancouver.
with day as (select (now() at time zone 'America/Vancouver')::date - 1 as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, planned)
select v.id, '11111111-1111-1111-1111-111111111111', v.category, v.note, day.d, v.at,
       case when v.ends is null then null else (day.d + v.ends) at time zone 'America/Vancouver' end,
       false
  from day,
       (values
         ('b1000000-0000-0000-0000-000000000011'::uuid, 'a1000000-0000-0000-0000-000000000001'::uuid,
          'schema, first pass', '13:00'::time, '15:00'::time),
         ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003',
          'that one song again', '20:10', '20:10'),
         ('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000004',
          'quiet one', null, null)
       ) as v(id, category, note, at, ends);

-- Mina, today in Seoul. Gives the friend rail something to sit at an hour
-- against, across a sixteen-hour offset from Yoonji's day.
with day as (select (now() at time zone 'Asia/Seoul')::date as d)
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at, planned)
select v.id, '22222222-2222-2222-2222-222222222222', v.category, v.note, day.d, v.at,
       case when v.ends is null then null else (day.d + v.ends) at time zone 'Asia/Seoul' end,
       false
  from day,
       (values
         ('b2000000-0000-0000-0000-000000000001'::uuid, 'a2000000-0000-0000-0000-000000000002'::uuid,
          'seongsu, again', '11:20'::time, '11:20'::time),
         ('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001',
          'thesis', '14:00', null),
         ('b2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000004',
          'rained all afternoon', null, null)
       ) as v(id, category, note, at, ends);

-- Jae went quiet five days ago: a Ripple that persists (C7 — presence expires,
-- records do not) behind a profile that is past its TTL.
insert into public.ripples (id, author_id, category_id, note, occurred_on, occurred_time, ended_at)
values (
  'b3000000-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  'a3000000-0000-0000-0000-000000000004',
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
