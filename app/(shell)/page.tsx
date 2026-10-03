import { redirect } from 'next/navigation';

import { HomeGround } from '@/features/home/home-ground';
import { scopedMonth } from '@/features/home/scope';
import { monthCounts, monthSeats, scrubberMonths } from '@/features/sessions/shelves';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySplashes, summarizeSplashes } from '@/lib/queries/splashes';
import { getMyTrail } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * Home (SPEC 5, H21): the water ground, scoped to one month. The same rows
 * the Trail reads, shelved by month here and cut by day there; neither is a
 * feed — nothing anyone else wrote arrives on it.
 */
export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // The proxy guarantees a session; a missing profile means the bootstrap did
  // not complete, so send the visitor back through it.
  if (!profile) redirect('/sign-in');

  const now = new Date();
  const today = todayIn(profile.timezone);
  const month = scopedMonth((await searchParams).m, today);

  const [ripples, categories, boards] = await Promise.all([
    getMyTrail(supabase, profile.id, profile.timezone),
    getMyCategories(supabase),
    getMySplashes(supabase, profile.id),
  ]);
  const summaries = summarizeSplashes(boards, ripples, profile.timezone, now);
  const pinned = summaries
    .filter((s) => s.pinnedAt !== null)
    .sort((a, b) => b.pinnedAt!.localeCompare(a.pinnedAt!));

  return (
    <main className="water-ground flex min-h-[calc(100dvh-var(--tab-bar-h))] flex-1 flex-col">
      <HomeGround
        month={month}
        months={scrubberMonths(summaries, today, profile.timezone)}
        counts={monthCounts(summaries, profile.timezone)}
        seats={monthSeats(summaries, month, profile.timezone)}
        pinned={pinned}
        categories={categories}
      />
    </main>
  );
}
