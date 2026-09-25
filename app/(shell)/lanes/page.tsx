import { redirect } from 'next/navigation';

import { LanesMatrix } from '@/features/lanes/lanes-matrix';
import { laneRows } from '@/features/lanes/matrix';
import { getLaneCounts } from '@/lib/queries/lanes';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * SPEC 5: my categories x days. Exploration lives here; recall lives in the
 * Locker, and D10 forbids either eroding the other — no aggregates on this
 * page, no matrix on that one.
 */
export default async function LanesPage() {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const today = todayIn(profile.timezone);
  const [categories, span] = await Promise.all([
    getMyCategories(supabase),
    getLaneCounts(supabase, profile.id, profile.timezone, today),
  ]);

  const rows = laneRows(today, span.earliest, span.counts);

  return (
    // A fixed height rather than a minimum: the matrix inside scrolls in both
    // directions, and a box that can grow gives its headers no scrollport to
    // stick to.
    <main className="flex h-[calc(100dvh-var(--tab-bar-h))] flex-1 flex-col">
      <LanesMatrix categories={categories} rows={rows} />
    </main>
  );
}
