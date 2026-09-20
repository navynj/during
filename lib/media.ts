'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { MEDIA_BUCKET } from '@/lib/media-bucket';

/** Long enough to load a sheet, short enough that a leaked URL rots fast. */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Signs the media on a Ripple, after checking that the viewer may see the
 * Ripple at all.
 *
 * The check is the point. A path-prefix read policy — `<owner>/…` — can only
 * answer "is this mine", which S0 rejected: in P2 a linked friend must be able
 * to see media on a Ripple they are allowed to see, and must still be refused
 * a locked one. That question is `can_see_ripple`, so the visibility check runs
 * through the viewer's own session (RLS answers it), and only then does the
 * service role sign. The same code path serves P1's owner-only case and P2's
 * without changing.
 */
export async function signRippleMedia(rippleId: string): Promise<string[]> {
  const supabase = await createClient();

  // RLS decides. A Ripple the viewer may not see simply is not returned.
  const { data: ripple } = await supabase
    .from('ripples')
    .select('media')
    .eq('id', rippleId)
    .maybeSingle();

  if (!ripple || ripple.media.length === 0) return [];

  const service = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await service.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(ripple.media, SIGNED_URL_TTL_SECONDS);

  if (error) return [];
  return data.flatMap((entry) => (entry.signedUrl ? [entry.signedUrl] : []));
}

/**
 * Removes objects for a Ripple and everything inside it.
 *
 * Deletes are hard and include storage (CLAUDE.md): a row that is gone while
 * its photograph survives is not a delete, it is a broken reference with a
 * privacy problem attached.
 */
export async function removeRippleMedia(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const service = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  await service.storage.from(MEDIA_BUCKET).remove(paths);
}
