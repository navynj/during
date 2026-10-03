import { redirect } from 'next/navigation';

import { Trail } from '@/features/locker/trail';
import { getMyProfile } from '@/lib/queries/profile';
import { getMyTrail, groupByDay } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';

/**
 * SPEC 5: the Locker is my private global archive and recall engine. The
 * Trail is its scroll; aggregates and one-year-ago join it later, and D10
 * keeps matrices out of here entirely — those are Lanes.
 */
export default async function LockerPage() {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const ripples = await getMyTrail(supabase, profile.id, profile.timezone);
  const days = groupByDay(ripples, profile.timezone);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-var(--tab-bar-h))] w-full max-w-xl flex-1 flex-col px-6">
      <Trail days={days} timeZone={profile.timezone} />
    </main>
  );
}
