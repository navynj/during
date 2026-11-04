-- 0075: a reply from no pool is to its writer alone (H77, 2026-11-04).
--
-- Every reply belongs to exactly one place: one pool, or Only me. A reply
-- with no thread pool is the record owner's from Home (0053: null only for
-- the owner writing from no pool; anyone else's takes their pool, and a
-- deleted pool's are closed, read by the owner and the writer already,
-- 0054). Until now such a reply was read by everyone who could read the
-- ripple — in every pool the record is in — and notified those who had
-- replied before. Now it is read by its writer, the record's owner, alone,
-- and notifies no one.
--
-- Existing pool-less replies become Only me (approved by Yoonji, 2026-11-04).
-- No row changes: the read rule does it. Production before this (one
-- read-only query, 2026-11-04): three, all the owner's —
--   704b8410…  2026-10-27  Cameron Library, shown in Our Pool;
--   11844a6f…  2026-10-30  재택 복귀..., shown in Our Pool, Pancake,
--                          SY Pool, WhaleFox Pool, 그림릴레이;
--   494be910…  2026-11-03  너무 배고프다, shown in SY Pool.
--
-- Reactions are not part of this: one from no pool reads as before, so
-- response_readable, which reactions share, is untouched; the reply read
-- paths say it themselves. Replaced, nothing dropped: ripple_replies_in
-- (what the app reads), ripple_replies_for (its older form, still
-- granted), notify_reply. _answered_by_others counts only others' replies,
-- never the owner's, so it needs nothing.

create or replace function public.ripple_replies_in(p_ripples uuid[])
returns table (
  id uuid,
  ripple_id uuid,
  author_id uuid,
  body text,
  created_at timestamptz,
  edited_at timestamptz,
  hidden boolean,
  former boolean,
  thread_pool_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         r.ripple_id,
         r.author_id,
         case when r.hidden_at is null
                or r.author_id = auth.uid()
                or r.ripple_id in (select private.my_ripples())
              then r.body end,
         r.created_at,
         r.edited_at,
         r.hidden_at is not null,
         -- responder_former: the ripple is in a pool, and the writer is a
         -- current member of none of its pools.
         exists (select 1 from public._ripple_pools(r.ripple_id))
           and not exists (
             select 1 from public._ripple_pools(r.ripple_id) p(pool_id)
               join public.pool_members m on m.pool_id = p.pool_id and m.user_id = r.author_id
              where m.left_at is null
           ),
         r.thread_pool_id
    from public.ripple_replies r
   where r.ripple_id = any(p_ripples)
     and case
       when r.thread_closed then
         auth.uid() is not null
         and (r.author_id = auth.uid() or r.ripple_id in (select private.ripples_on_my_records()))
       else
         r.ripple_id in (select private.response_ripples())
         and (
           r.author_id = auth.uid()
           or (r.ripple_id, r.author_id) in (select * from private.response_writers())
         )
         and (
           -- From no pool: to its writer, the record's owner, alone (H77) —
           -- read through the two lines below, never through a pool.
           r.author_id = auth.uid()
           or r.ripple_id in (select private.ripples_on_my_records())
           or (r.thread_pool_id in (select private.my_pools())
             and (r.thread_pool_id, r.author_id) in (select * from private.visible_members())
             and (r.ripple_id, r.thread_pool_id) in (select * from private.response_ripple_pools()))
         )
     end
   order by r.created_at, r.id;
$$;

create or replace function public.ripple_replies_for(p_ripples uuid[])
returns table (
  id uuid,
  ripple_id uuid,
  author_id uuid,
  body text,
  created_at timestamptz,
  edited_at timestamptz,
  hidden boolean,
  former boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         r.ripple_id,
         r.author_id,
         case when r.hidden_at is null
                or r.author_id = auth.uid()
                or public.ripple_author(r.ripple_id) = auth.uid()
              then r.body end,
         r.created_at,
         r.edited_at,
         r.hidden_at is not null,
         public.responder_former(r.ripple_id, r.author_id)
    from public.ripple_replies r
   where r.ripple_id = any(p_ripples)
     and public.response_readable(r.ripple_id, r.author_id, r.thread_pool_id, r.thread_closed)
     -- From no pool: to its writer, the record's owner, alone (H77).
     and (r.thread_pool_id is not null or r.thread_closed or r.author_id = auth.uid())
   order by r.created_at, r.id;
$$;

create or replace function public.notify_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.ripples%rowtype;
  s public.splashes%rowtype;
  who uuid;
  pid uuid;
begin
  -- Mine to me alone (H77): a reply from no pool tells no one.
  if new.thread_pool_id is null then
    return null;
  end if;
  begin
    select * into r from public.ripples where id = new.ripple_id;
    select * into s from public.splashes where id = r.splash_id;
    for who in
      select distinct t.uid from (
        select r.author_id as uid
        union select s.owner_id
        union select x.author_id from public.ripples x
               where s.owner_id is null and x.splash_id = s.id
        union select y.author_id from public.ripple_replies y
               where y.ripple_id = new.ripple_id and y.id <> new.id
      ) t
       where t.uid is not null and t.uid <> new.author_id
    loop
      -- Only the thread's own people: its current members.
      pid := case when exists (
               select 1 from public.pool_members m
                where m.pool_id = new.thread_pool_id and m.user_id = who and m.left_at is null
             ) then new.thread_pool_id end;
      continue when pid is null;
      continue when public._notification_value(who, pid, 'reply') <> 'on';
      insert into public.notifications
        (recipient_id, type, pool_id, splash_id, ripple_id, reply_id, actor_id)
      values (who, 'reply', pid, s.id, new.ripple_id, new.id, new.author_id);
    end loop;
  exception when others then
    raise warning 'notify_reply: %', sqlerrm;
  end;
  return null;
end;
$$;
