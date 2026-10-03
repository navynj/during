-- 0007: the refounding (H21).
--
-- Four changes, each recorded in DECISIONS H21:
--   (a) Ripples COMPOSE Splashes: a block is the post's content, so deleting
--       the post deletes its blocks — the FK goes from SET NULL to CASCADE
--       (the reversal of H20d, recorded explicitly);
--   (e) sessions: a shelf of posts. Monthly ones are derived from the
--       calendar and get a row lazily, only when titled; custom ones are
--       made. A post sits on at most one custom session;
--   (f) a declared lane is a DEFAULT, one per post, so `lane_ids uuid[]`
--       becomes `declared_lane_id`; lane tags are derived from the blocks
--       and never stored;
--   (g) pinned posts: `pinned_at`.
--
-- Destructive DDL below — the splash FK is dropped and recreated, and
-- `lane_ids` is dropped after its backfill. Approved in the session brief
-- (2026-10-02): "the 0006 migration changes the FK accordingly (CASCADE)"
-- and "backfill from lane_ids[0], then drop lane_ids". It lands as 0007
-- because 0006 was already the date-only span.

-- ---------------------------------------------------------------------------
-- sessions — a shelf of posts (H21e)
-- ---------------------------------------------------------------------------

create type public.session_kind as enum ('monthly', 'custom');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind public.session_kind not null,
  title text not null,
  -- Monthly: the first day of the month this row titles. A monthly session
  -- exists because the calendar says so; the row exists only once titled.
  month date,
  -- Custom only. A declared range is descriptive, never a deadline (H20e).
  declared_start date,
  declared_end date,
  lane_id uuid references public.my_categories (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint sessions_shape check (
    (kind = 'monthly'
      and month is not null and extract(day from month) = 1
      and declared_start is null and declared_end is null and lane_id is null)
    or (kind = 'custom' and month is null)
  ),
  constraint sessions_declared_range check (
    declared_end is null or declared_start is null or declared_end >= declared_start
  ),
  constraint sessions_title_present check (length(btrim(title)) > 0)
);

comment on table public.sessions is
  'A shelf of posts (H21e). Monthly rows are lazy — a month exists without one; custom rows are made.';
comment on column public.sessions.month is
  'Monthly only: the first of the month. Unique per owner.';

-- One title per month per owner. Partial, so custom rows are unconstrained.
create unique index sessions_monthly_unique
  on public.sessions (owner_id, month)
  where kind = 'monthly';

create index sessions_owner_idx on public.sessions (owner_id, created_at desc);

alter table public.sessions enable row level security;

create policy "sessions belong to their owner"
  on public.sessions for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- splashes — a post: its shelf, its pin, its one declared lane (H21a, f, g)
-- ---------------------------------------------------------------------------

alter table public.splashes
  -- At most one custom session per post. Deleting the shelf unshelves.
  add column session_id uuid references public.sessions (id) on delete set null,
  add column pinned_at timestamptz,
  -- The default lane of a new block (H21f). Lane tags are derived from the
  -- blocks and never stored; this is the first and representative one.
  add column declared_lane_id uuid references public.my_categories (id) on delete set null;

comment on column public.splashes.declared_lane_id is
  'The default lane of a new block (H21f); never an override. Tags are derived: this first, then every lane the blocks took.';
comment on column public.splashes.session_id is
  'The one custom session this post sits on, or null (H21e). Monthly membership is derived from its range.';
comment on column public.splashes.pinned_at is
  'Set while pinned to the bar above the tab bar (H21g).';

-- Backfill: the first declared lane becomes the declared lane. lane_ids had
-- no foreign key, so a lane that no longer exists is simply not carried.
update public.splashes s
   set declared_lane_id = s.lane_ids[1]
 where cardinality(s.lane_ids) > 0
   and exists (select 1 from public.my_categories c where c.id = s.lane_ids[1]);

alter table public.splashes drop column lane_ids;

create index splashes_session_idx on public.splashes (session_id) where session_id is not null;
create index splashes_pinned_idx on public.splashes (owner_id, pinned_at desc) where pinned_at is not null;

-- ---------------------------------------------------------------------------
-- ripples — composition: a block goes with its post (H21, the reversal)
-- ---------------------------------------------------------------------------

alter table public.ripples drop constraint ripples_splash_id_fkey;

alter table public.ripples
  add constraint ripples_splash_id_fkey
  foreign key (splash_id) references public.splashes (id) on delete cascade;

comment on column public.ripples.splash_id is
  'The post this block composes, or null for a block that renders as an untitled post of one. Deleting the post deletes its blocks (H21).';
