-- Timeline exclusivity and inner ripples (H10).
--
-- A day is a single axis, so two top-level Ripples by one author cannot claim
-- the same moment. Concurrency is expressed as containment instead: something
-- that happens during a timed span is an *inner ripple*, a full Ripple with
-- its own category and note, carried inside its parent.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- inner ripples
-- ---------------------------------------------------------------------------

alter table public.ripples
  add column parent_ripple_id uuid references public.ripples (id) on delete cascade;

comment on column public.ripples.parent_ripple_id is
  'Set on an inner ripple: a Ripple that happened inside a parent timed span. One level only; inner ripples never carry inner ripples.';

create index ripples_parent_idx on public.ripples (parent_ripple_id)
  where parent_ripple_id is not null;

-- ---------------------------------------------------------------------------
-- the instant a Ripple started
--
-- occurred_on + occurred_time are an author-local wall clock, and the zone
-- lives on the profile, so the instant cannot be derived inside a constraint.
-- It is resolved once at write time and stored, which also means a later
-- timezone change on the profile does not move records that already happened.
-- ---------------------------------------------------------------------------

alter table public.ripples add column started_at timestamptz;

create function public.set_ripple_started_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  zone text;
begin
  if new.occurred_time is null then
    new.started_at := null;
    return new;
  end if;

  select timezone into zone from public.profiles where id = new.author_id;
  -- timezone(text, timestamp) is immutable, which is what lets the span below
  -- be indexed at all.
  new.started_at := timezone(coalesce(zone, 'UTC'), (new.occurred_on + new.occurred_time));
  return new;
end;
$$;

create trigger ripples_set_started_at
  before insert or update of occurred_on, occurred_time, author_id on public.ripples
  for each row execute function public.set_ripple_started_at();

update public.ripples r
   set started_at = timezone(coalesce(p.timezone, 'UTC'), (r.occurred_on + r.occurred_time))
  from public.profiles p
 where p.id = r.author_id
   and r.occurred_time is not null;

-- ---------------------------------------------------------------------------
-- the span a Ripple occupies
-- ---------------------------------------------------------------------------

create function public.ripple_span(started timestamptz, ended timestamptz)
returns tstzrange
language sql
immutable
as $$
  select case
    when started is null then null
    -- A running timer holds the axis until it is stopped, which is what makes
    -- "at most one in-progress timer" fall out of the same constraint.
    when ended is null then tstzrange(started, 'infinity', '[)')
    -- Half-open, so back-to-back records touching at an endpoint do not
    -- overlap: 09:00-10:00 and 10:00-11:00 are adjacent, not concurrent.
    when ended > started then tstzrange(started, ended, '[)')
    -- A drop is a point, and a point inside a span *is* inside it. An empty
    -- range would overlap nothing and let drops land on top of a session.
    else tstzrange(started, started, '[]')
  end
$$;

-- ---------------------------------------------------------------------------
-- exclusivity
--
-- Planned Ripples are exempt: intentions are allowed to collide, and the
-- clash is resolved when one is checked rather than when it is written
-- (SPEC 6 — unchecked plans fade without guilt).
-- ---------------------------------------------------------------------------

alter table public.ripples
  add constraint ripples_top_level_no_overlap
  exclude using gist (
    author_id with =,
    public.ripple_span(started_at, ended_at) with &&
  )
  where (parent_ripple_id is null and planned = false and started_at is not null);

-- ---------------------------------------------------------------------------
-- containment
-- ---------------------------------------------------------------------------

create function public.check_inner_ripple()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent public.ripples%rowtype;
begin
  if new.parent_ripple_id is null then
    return new;
  end if;

  select * into parent from public.ripples where id = new.parent_ripple_id;

  if parent.id is null then
    raise exception 'parent ripple % does not exist', new.parent_ripple_id;
  end if;
  if parent.author_id <> new.author_id then
    raise exception 'an inner ripple must share its parent''s author';
  end if;
  -- One level only: an inner ripple is a thing that happened during a
  -- session, not the root of another tree.
  if parent.parent_ripple_id is not null then
    raise exception 'an inner ripple cannot carry inner ripples';
  end if;
  if parent.started_at is null then
    raise exception 'a date-only Ripple has no span to sit inside';
  end if;
  if new.started_at is null
     or not (public.ripple_span(parent.started_at, parent.ended_at)
             @> public.ripple_span(new.started_at, new.ended_at)) then
    raise exception 'an inner ripple must lie within its parent''s span';
  end if;

  return new;
end;
$$;

create trigger ripples_check_inner
  after insert or update of parent_ripple_id, occurred_on, occurred_time, ended_at
  on public.ripples
  for each row execute function public.check_inner_ripple();

-- ---------------------------------------------------------------------------
-- audience inheritance
--
-- An inner ripple has no audience of its own in v1a: it is part of what its
-- parent records, so a locked parent hides it too. Without this a friend
-- would see the contents of a locked session.
-- ---------------------------------------------------------------------------

create or replace function public.ripple_is_locked(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.ripple_audience a
     where a.target_type = 'lock'
       and a.ripple_id in (
         select rid
         union all
         select parent_ripple_id from public.ripples where id = rid
       )
  );
$$;
