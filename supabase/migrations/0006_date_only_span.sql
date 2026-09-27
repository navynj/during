-- 0006: a span by dates alone.
--
-- Time is an annotation, not an obligation (H20a). A fragment may be placed
-- on a date without a clock; it may now also span to an end date without one.
-- The end is stored as before, in `ended_at`, at the close of the end day in
-- the author's zone; what changes is only the shape rule, which demanded a
-- clock on any record that has an end.
--
-- Destructive DDL (a constraint is dropped). Approved in the session by
-- Yoonji: "drop the ripples_ended_needs_time check by migration. time is
-- optional. for ripple. apply to local stack" (2026-09-27).

alter table public.ripples drop constraint ripples_ended_needs_time;

-- An end still needs a beginning: a date, if not a clock.
alter table public.ripples
  add constraint ripples_ended_needs_date check (ended_at is null or occurred_on is not null);

comment on column public.ripples.ended_at is
  'The end of a span. With occurred_time, an instant the clock refers to; without one, the close of the end date in the author''s zone — a span by dates alone.';
