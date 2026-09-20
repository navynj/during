-- During: full schema (SPEC 8) with RLS on every table.
--
-- Tables for the Pool world (pools, pool_lanes, pool_members, lane_mappings,
-- splashes) and for Lists are created now although v1a never touches them:
-- reserved tables cost nothing and save a migration later. They ship
-- owner-only, with no sharing path until v1.5 designs the join contract.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------------

-- SPEC 2: a Ripple is either a drop (a point in time) or a timed (explicit
-- timer). A category carries the default mode its chip commits with (E2).
create type public.ripple_mode as enum ('drop', 'timed');

-- SPEC 4: one audience spectrum — everyone (no row), selected lists/pools, or
-- only me. Lock is one end of the spectrum, not a separate feature (C8).
create type public.audience_target as enum ('list', 'pool', 'lock');

create type public.splash_type as enum ('free', 'prompted');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  -- Author-local day boundaries depend on this: occurred_on is a wall-clock
  -- date in the author's zone, and During is used across Vancouver and Korea
  -- from week one.
  timezone text not null default 'UTC',
  -- C7: Submerge is a TTL, never a stored flag. What is stored is the last
  -- activity instant; presence is computed at read time by comparing it to
  -- now() minus the TTL. Maintained by a trigger on ripples.
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on column public.profiles.last_active_at is
  'Last activity instant. Presence (Submerge, C7) is computed from this at read time; never store an expiry flag.';

-- ---------------------------------------------------------------------------
-- links — mutual friendship, one row per pair (C1)
-- ---------------------------------------------------------------------------

create table public.links (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  -- A Link has no direction, so the pair is stored in a canonical order and
  -- the ordering check makes the reversed duplicate unrepresentable.
  constraint links_canonical_order check (user_a < user_b)
);

create index links_user_b_idx on public.links (user_b);

-- ---------------------------------------------------------------------------
-- lists — my private labels over Links, never visible to others
-- ---------------------------------------------------------------------------

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index lists_owner_idx on public.lists (owner_id);

create table public.list_members (
  list_id uuid not null references public.lists (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  primary key (list_id, member_id)
);

-- ---------------------------------------------------------------------------
-- pools — reserved for v1.5
-- ---------------------------------------------------------------------------

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  ephemeral boolean not null default false,
  born_from_splash uuid,
  created_at timestamptz not null default now()
);

create table public.pool_members (
  pool_id uuid not null references public.pools (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- D7: column order in Swimmers is me first, then join order.
  joined_at timestamptz not null default now(),
  primary key (pool_id, user_id)
);

create table public.pool_lanes (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  name text not null,
  icon text,
  position integer not null default 0
);

create index pool_lanes_pool_idx on public.pool_lanes (pool_id, position);

create table public.splashes (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  type public.splash_type not null default 'free',
  prompt text,
  ends_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint splashes_prompt_present check (type <> 'prompted' or prompt is not null)
);

alter table public.pools
  add constraint pools_born_from_splash_fkey
  foreign key (born_from_splash) references public.splashes (id) on delete set null;

-- ---------------------------------------------------------------------------
-- my_categories — the "what" axis (SPEC 4)
-- ---------------------------------------------------------------------------

create table public.my_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  icon text,
  default_mode public.ripple_mode not null default 'drop',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index my_categories_user_idx on public.my_categories (user_id, position);

-- ---------------------------------------------------------------------------
-- lane_mappings — the plumbing (C5: mapping is the precondition of any leak)
-- ---------------------------------------------------------------------------

create table public.lane_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  my_category_id uuid not null references public.my_categories (id) on delete cascade,
  pool_lane_id uuid not null references public.pool_lanes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (my_category_id, pool_lane_id)
);

-- ---------------------------------------------------------------------------
-- ripples — every remaining record is a row here (B3)
-- ---------------------------------------------------------------------------

create table public.ripples (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  -- Display format is `category · note` (SPEC 7), so every Ripple carries one.
  -- RESTRICT: a category with records cannot vanish out from under them.
  category_id uuid not null references public.my_categories (id) on delete restrict,
  note text,
  media text[] not null default '{}',
  -- Author-local wall clock. occurred is separate from created so a backfill
  -- lands on the day it happened, not the day it was typed (SPEC 8).
  occurred_on date not null,
  occurred_time time,
  -- SPEC 8: null = in progress; = start for drops. With occurred_time this is
  -- a complete encoding of the four states, so no `kind` column is needed:
  --
  --   occurred_time  ended_at        state
  --   -------------  --------------  ----------------------------------------
  --   null           null            date-only record (Daily Note area)
  --   set            = start instant drop
  --   set            null            timed, in progress (its last line grows)
  --   set            > start instant timed, finished (span = duration)
  --
  -- The start instant is (occurred_on + occurred_time) read in the author's
  -- timezone; it is derived rather than stored so the wall clock stays the
  -- single source of truth.
  ended_at timestamptz,
  planned boolean not null default false,
  participants uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  -- A record with no time cannot have an end.
  constraint ripples_ended_needs_time check (ended_at is null or occurred_time is not null)
);

create index ripples_author_day_idx on public.ripples (author_id, occurred_on);
create index ripples_created_idx on public.ripples (created_at desc);

-- ---------------------------------------------------------------------------
-- ripple_audience — routing (SPEC 4)
-- ---------------------------------------------------------------------------

-- Polymorphic in the spec sketch, split into two nullable foreign keys here so
-- the references stay real: a deleted List or Pool cannot leave a dangling
-- audience row. 'lock' carries no target.
create table public.ripple_audience (
  ripple_id uuid not null references public.ripples (id) on delete cascade,
  target_type public.audience_target not null,
  list_id uuid references public.lists (id) on delete cascade,
  pool_id uuid references public.pools (id) on delete cascade,
  constraint ripple_audience_target_shape check (
    (target_type = 'lock' and list_id is null and pool_id is null)
    or (target_type = 'list' and list_id is not null and pool_id is null)
    or (target_type = 'pool' and pool_id is not null and list_id is null)
  )
);

create index ripple_audience_ripple_idx on public.ripple_audience (ripple_id, target_type);
-- At most one lock row per Ripple; lock is a state, not a list.
create unique index ripple_audience_lock_idx
  on public.ripple_audience (ripple_id)
  where target_type = 'lock';

-- ---------------------------------------------------------------------------
-- ripple_views — the witness signal (A6)
-- ---------------------------------------------------------------------------

-- One row per viewer, not per opening: the count the author sees is how many
-- people witnessed the Ripple, and re-opening does not inflate it. viewed_at
-- holds the most recent opening. Never exposed as a viewer list (A6, H1-b).
create table public.ripple_views (
  ripple_id uuid not null references public.ripples (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (ripple_id, viewer_id)
);

-- ---------------------------------------------------------------------------
-- presence
-- ---------------------------------------------------------------------------

create function public.touch_last_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set last_active_at = now()
   where id = new.author_id;
  return new;
end;
$$;

create trigger ripples_touch_last_active
  after insert on public.ripples
  for each row execute function public.touch_last_active();

-- ---------------------------------------------------------------------------
-- Realtime: a friend's drop must reach an open rail without a refresh (S4).
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.ripples;

-- ===========================================================================
-- Row level security
--
-- The leak model's two visibility paths live here, never in application code.
-- If a query needs data these policies hide, the policy is wrong or the
-- feature is out of scope.
--
-- v1a implements the Link path only. The Pool path arrives in v1.5 together
-- with the join contract (C6); until then every pool-side table is owner-only.
-- ===========================================================================

-- --- helpers ---------------------------------------------------------------
--
-- These are SECURITY DEFINER because a policy's subquery is itself subject to
-- the referenced table's RLS. A plain `not exists (select 1 from
-- ripple_audience ...)` inside the ripples policy would read as "no lock row"
-- for exactly the people the lock is meant to exclude, and locked Ripples
-- would leak. Reading through a definer function is what makes the lock real.

create function public.is_linked(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.links
     where (user_a = least(auth.uid(), other) and user_b = greatest(auth.uid(), other))
  );
$$;

create function public.ripple_is_locked(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.ripple_audience
     where ripple_id = rid
       and target_type = 'lock'
  );
$$;

create function public.ripple_author(rid uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select author_id from public.ripples where id = rid;
$$;

-- The Link path, in one place: mine always; a linked friend's unless locked.
create function public.can_see_ripple(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.ripples r
     where r.id = rid
       and (
         r.author_id = auth.uid()
         or (public.is_linked(r.author_id) and not public.ripple_is_locked(r.id))
       )
  );
$$;

-- --- profiles --------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles are readable by self and linked users"
  on public.profiles for select
  using (id = auth.uid() or public.is_linked(id));

create policy "profiles are inserted by self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles are updated by self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles are deleted by self"
  on public.profiles for delete
  using (id = auth.uid());

-- --- links -----------------------------------------------------------------

alter table public.links enable row level security;

create policy "links are readable by either side"
  on public.links for select
  using (auth.uid() in (user_a, user_b));

-- The invite flow: whoever accepts inserts the row, and can only write a row
-- they are part of. A Link is mutual by construction (C1), so there is no
-- pending state and nothing to update.
create policy "links are inserted by a participant"
  on public.links for insert
  with check (auth.uid() in (user_a, user_b));

create policy "links are deleted by either side"
  on public.links for delete
  using (auth.uid() in (user_a, user_b));

-- --- my_categories ---------------------------------------------------------
--
-- Owner-only. A linked friend sees waves on the rail and, per SPEC 10, a mini
-- half-sheet of note / time / media / view count — no category badge — so
-- nothing friend-facing needs these rows. Were a friend-visible badge ever
-- specced, the policy would have to open per-Ripple, not wholesale: the full
-- category list is a routing declaration and leaking it would expose
-- categories that only ever carry locked Ripples.

alter table public.my_categories enable row level security;

create policy "categories belong to their owner"
  on public.my_categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --- ripples ---------------------------------------------------------------

alter table public.ripples enable row level security;

create policy "ripples are readable by author, and by links unless locked"
  on public.ripples for select
  using (
    author_id = auth.uid()
    or (public.is_linked(author_id) and not public.ripple_is_locked(id))
  );

create policy "ripples are inserted by their author"
  on public.ripples for insert
  with check (author_id = auth.uid());

create policy "ripples are updated by their author"
  on public.ripples for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "ripples are deleted by their author"
  on public.ripples for delete
  using (author_id = auth.uid());

-- --- ripple_audience -------------------------------------------------------
--
-- Routing is private in both directions: Lists are never visible to others
-- (SPEC 2), and the absence of a lock row must not be readable either.

alter table public.ripple_audience enable row level security;

create policy "audience rows belong to the ripple's author"
  on public.ripple_audience for all
  using (public.ripple_author(ripple_id) = auth.uid())
  with check (public.ripple_author(ripple_id) = auth.uid());

-- --- ripple_views ----------------------------------------------------------

alter table public.ripple_views enable row level security;

-- Only the author reads the witness signal, and only ever as a count (A6).
create policy "views are readable by the ripple's author"
  on public.ripple_views for select
  using (public.ripple_author(ripple_id) = auth.uid());

-- There is no write policy: every view goes through record_ripple_view()
-- below. A client-side upsert would need to read back the row it is
-- overwriting, and that read is exactly what author-only SELECT forbids.
-- One door also means the caller never handles the composite key.

create function public.record_ripple_view(rid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_see_ripple(rid) then
    raise exception 'ripple not visible' using errcode = '42501';
  end if;

  -- Authors do not witness themselves, so opening one's own Ripple is a
  -- no-op rather than an error: it happens constantly (A6).
  if public.ripple_author(rid) = auth.uid() then
    return;
  end if;

  -- Re-opening refreshes viewed_at; the count is people, not openings.
  insert into public.ripple_views (ripple_id, viewer_id, viewed_at)
  values (rid, auth.uid(), now())
  on conflict (ripple_id, viewer_id) do update set viewed_at = now();
end;
$$;

revoke execute on function public.record_ripple_view(uuid) from anon;

-- --- lists -----------------------------------------------------------------

alter table public.lists enable row level security;

create policy "lists belong to their owner"
  on public.lists for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

alter table public.list_members enable row level security;

create policy "list members belong to the list owner"
  on public.list_members for all
  using (exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid()));

-- --- pool world (reserved, owner-only until v1.5) --------------------------

alter table public.pools enable row level security;

create policy "pools belong to their owner"
  on public.pools for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

alter table public.pool_members enable row level security;

create policy "pool members are managed by the pool owner"
  on public.pool_members for all
  using (exists (select 1 from public.pools p where p.id = pool_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.pools p where p.id = pool_id and p.owner_id = auth.uid()));

alter table public.pool_lanes enable row level security;

create policy "pool lanes are managed by the pool owner"
  on public.pool_lanes for all
  using (exists (select 1 from public.pools p where p.id = pool_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.pools p where p.id = pool_id and p.owner_id = auth.uid()));

alter table public.splashes enable row level security;

create policy "splashes are managed by the pool owner"
  on public.splashes for all
  using (exists (select 1 from public.pools p where p.id = pool_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.pools p where p.id = pool_id and p.owner_id = auth.uid()));

alter table public.lane_mappings enable row level security;

create policy "lane mappings belong to their owner"
  on public.lane_mappings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
