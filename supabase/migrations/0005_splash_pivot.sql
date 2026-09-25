-- The Splash pivot (H20).
--
-- Three changes, each recorded in DECISIONS H20:
--   (d) splashes become personal topic boards, owner-only, with a declared
--       range and declared lanes; ripples.splash_id is the association;
--   (c) the display axis is the diary's own order, so occurred_on may be
--       null (an unannotated fragment flows by created_at), and the
--       top-level exclusion constraint goes: overlapping spans are two
--       legitimate records, not a scheduling conflict;
--   (b) the live-tracking machinery (started_at, the containment triggers,
--       parent_ripple_id) stays exactly as it is, dormant, for P3's Swim.
--
-- Destructive DDL below (the DROP CONSTRAINT) was approved in the session
-- brief: "drop the btree_gist exclusion constraint by migration (it now
-- rejects legitimate overlapping records)". Nothing else here drops.

-- ---------------------------------------------------------------------------
-- splashes: from a reserved pool board to a personal one
-- ---------------------------------------------------------------------------

-- The board's author was already recorded; it is now also its owner. Renamed
-- rather than added, so there is one column that answers "whose".
alter table public.splashes rename column created_by to owner_id;

-- A solo board belongs to no pool. The pool seat stays, nullable, for P3.
alter table public.splashes alter column pool_id drop not null;

alter table public.splashes
  add column title text not null default '',
  -- A declared range is descriptive, never a deadline (H20e): fragments
  -- outside it are legal. Dates, because a range is the author's calendar.
  add column declared_start date,
  add column declared_end date,
  -- Declared lanes govern by inheritance: a fragment thrown in takes one of
  -- these as its category. Empty = free choice, chip derived from contents.
  add column lane_ids uuid[] not null default '{}',
  add constraint splashes_declared_range check (
    declared_end is null or declared_start is null or declared_end >= declared_start
  );

alter table public.splashes alter column title drop default;

comment on column public.splashes.lane_ids is
  'Declared lanes (my_categories ids). One = the sheet hides the category choice; several = the chip row offers only these; none = free choice (H20e).';
comment on column public.splashes.declared_start is
  'Declared range, descriptive only. Null = derived from the first fragment (H20e).';
comment on column public.splashes.pool_id is
  'Reserved for P3: a pool-shared board. Null for a personal one (H20d).';

create index splashes_owner_idx on public.splashes (owner_id, created_at desc);

-- The owner's own policy. The pool-owner policy from 0001 stays in place
-- (removing a policy is destructive DDL): with pool_id null everywhere it
-- grants nothing, and it becomes P3's seat.
create policy "splashes belong to their owner"
  on public.splashes for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ripples: the association, and the unannotated fragment
-- ---------------------------------------------------------------------------

-- Deleting a splash DETACHES its fragments; it never deletes them (H20d).
-- The database holds that rule, so no code path can get it wrong.
alter table public.ripples
  add column splash_id uuid references public.splashes (id) on delete set null;

create index ripples_splash_idx on public.ripples (splash_id) where splash_id is not null;

comment on column public.ripples.splash_id is
  'The one board this fragment was thrown at, or null. Set null on splash delete: detach, never delete (H20d).';

-- An unannotated fragment has no occurred date at all: it flows by
-- created_at, and Locker/Lanes read its day as created_at in the author's
-- zone (H20c). A time without a date is still meaningless.
alter table public.ripples alter column occurred_on drop not null;

alter table public.ripples
  add constraint ripples_time_needs_date check (occurred_time is null or occurred_on is not null);

comment on column public.ripples.occurred_on is
  'Author-local date of the occurred annotation, or null for an unannotated fragment, which sits where it was posted (H20c).';

-- The exclusion constraint was written for an axis with one row per moment
-- (H10). On a diary that flows in posting order two overlapping spans are two
-- true statements, and the constraint had started refusing them.
alter table public.ripples drop constraint ripples_top_level_no_overlap;

-- started_at, ripple_span(), the containment triggers and parent_ripple_id
-- are untouched: dormant, not deleted (H20b).
