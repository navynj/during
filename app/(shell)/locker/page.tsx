import { redirect } from 'next/navigation';

import { Trail } from '@/features/locker/trail';
import { RippleSheetHost } from '@/features/ripple-sheet/sheet-host';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMyTrail, groupByDay } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * SPEC 5: the Locker is my private global archive and recall engine. The
 * Trail is its scroll; aggregates and one-year-ago join it later, and D10
 * keeps matrices out of here entirely — those are Lanes.
 */
export default async function LockerPage() {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const [ripples, categories] = await Promise.all([
    getMyTrail(supabase, profile.id),
    getMyCategories(supabase),
  ]);

  // Read once for the whole scroll: RLS already limits these rows to their
  // author, and the detail sheet needs the state the moment a row is tapped.
  const { data: lockRows } = await supabase
    .from('ripple_audience')
    .select('ripple_id')
    .eq('target_type', 'lock')
    .in(
      'ripple_id',
      ripples.length ? ripples.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000'],
    );

  const days = groupByDay(ripples);
  const now = new Date();

  return (
    <RippleSheetHost
      ripples={ripples}
      inner={[]}
      lockedIds={(lockRows ?? []).map((row) => row.ripple_id)}
      sheetContext={{
        categories,
        ripples,
        running: null,
        timeZone: profile.timezone,
        date: todayIn(profile.timezone),
      }}
    >
      <main className="flex min-h-[calc(100dvh-var(--tab-bar-h))] flex-1 flex-col">
        <Trail days={days} timeZone={profile.timezone} now={now} />
      </main>
    </RippleSheetHost>
  );
}
