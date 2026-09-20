-- Media for Ripples: a private bucket, owner-scoped writes.
--
-- Reads are deliberately NOT granted broadly here. Serving goes through a
-- server helper that checks the Ripple's own visibility first and then signs a
-- short-lived URL. S0 rejected a path-prefix read policy for exactly this
-- reason: `<owner>/…` can only ever answer "is this mine", and in P2 a linked
-- friend must be able to see media on a Ripple they are allowed to see while
-- still being refused a locked one. That question lives in `can_see_ripple`,
-- not in the object's name.

insert into storage.buckets (id, name, public)
values ('ripple-media', 'ripple-media', false)
on conflict (id) do nothing;

-- Uploads come straight from the browser, so the path prefix is what stops an
-- author writing into someone else's folder.
create policy "ripple media is written by its owner"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ripple-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ripple media is replaced by its owner"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ripple-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Hard deletes include the objects (CLAUDE.md: privacy over recovery).
create policy "ripple media is deleted by its owner"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ripple-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- An owner may list their own objects; everyone else's access goes through
-- the signed-URL path, which is checked against the Ripple rather than the
-- folder name.
create policy "ripple media is listed by its owner"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ripple-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
