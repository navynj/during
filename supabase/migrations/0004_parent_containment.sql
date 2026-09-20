-- A session must keep containing its inner ripples when *it* moves (H17).
--
-- 0002 checks containment on the child, which catches a child moving out of
-- its parent. It cannot catch the other direction: shrinking or moving a
-- parent left its children outside it silently, because nothing re-examined
-- them. Editing a finished session's end makes that reachable from the UI, so
-- the invariant moves to where it can be held.

create function public.check_parent_contains_children()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  stray public.ripples%rowtype;
begin
  -- Only a parent can strand children; a child's own move is 0002's job.
  if new.parent_ripple_id is not null then
    return new;
  end if;

  select c.* into stray
    from public.ripples c
   where c.parent_ripple_id = new.id
     and not (
       public.ripple_span(new.started_at, new.ended_at)
       @> public.ripple_span(c.started_at, c.ended_at)
     )
   limit 1;

  if stray.id is not null then
    raise exception 'inner ripple % falls outside the session span', stray.id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger ripples_parent_contains_children
  after update of started_at, ended_at, occurred_on, occurred_time on public.ripples
  for each row execute function public.check_parent_contains_children();
