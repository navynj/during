import { redirect } from 'next/navigation';

import { HomeFlow } from '@/features/home/home-flow';
import { buildFlow, monthSections } from '@/features/home/flow';
import { RippleSheetHost } from '@/features/ripple-sheet/sheet-host';
import { signOwnMedia } from '@/lib/media';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySplashes, summarizeSplashes } from '@/lib/queries/splashes';
import { getMyTrail } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/** How many photos a row shows before the detail sheet takes over. */
const ROW_THUMBNAILS = 3;

/**
 * Home (SPEC 5, H20): my whole diary as one flow, newest first, with two
 * view modes. The same query the Trail reads; the Trail cuts it by day and
 * this cuts it by month, and neither is a feed — nothing anyone else wrote
 * arrives here.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // The proxy guarantees a session; a missing profile means the bootstrap did
  // not complete, so send the visitor back through it.
  if (!profile) redirect('/sign-in');

  const now = new Date();
  const today = todayIn(profile.timezone);
  const [ripples, categories, boards] = await Promise.all([
    getMyTrail(supabase, profile.id, profile.timezone),
    getMyCategories(supabase),
    getMySplashes(supabase, profile.id),
  ]);
  const splashes = summarizeSplashes(boards, ripples, profile.timezone, now);

  // Lock state is read once for the flow rather than per sheet: RLS already
  // limits these rows to the author, and the detail sheet needs it on open.
  const { data: lockRows } = await supabase
    .from('ripple_audience')
    .select('ripple_id')
    .eq('target_type', 'lock')
    .in(
      'ripple_id',
      ripples.length ? ripples.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000'],
    );

  // Thumbnails are signed once, here, for the rows that carry photos. A photo
  // that could not be signed is a placeholder tile, never a failed page.
  const withPhotos = ripples.filter((r) => r.media.length > 0);
  const signed = await signOwnMedia(withPhotos.flatMap((r) => r.media.slice(0, ROW_THUMBNAILS)));
  const thumbnails = Object.fromEntries(
    withPhotos.map((r) => [
      r.id,
      r.media.slice(0, ROW_THUMBNAILS).map((path) => signed[path] ?? null),
    ]),
  );

  const sections = monthSections(buildFlow(ripples, splashes, profile.timezone), profile.timezone);

  return (
    <RippleSheetHost
      ripples={ripples}
      lockedIds={(lockRows ?? []).map((row) => row.ripple_id)}
      sheetContext={{ categories, splashes, timeZone: profile.timezone, today }}
    >
      <main className="flex min-h-[calc(100dvh-var(--tab-bar-h))] flex-1 flex-col">
        <HomeFlow
          sections={sections}
          splashes={splashes}
          categories={categories}
          thumbnails={thumbnails}
          timeZone={profile.timezone}
          today={today}
        />
      </main>
    </RippleSheetHost>
  );
}
