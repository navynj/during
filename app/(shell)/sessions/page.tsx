import { redirect } from 'next/navigation';

import { SessionsTab } from '@/features/sessions/sessions-tab';
import { earliestYear, monthCounts } from '@/features/sessions/shelves';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySessions } from '@/lib/queries/sessions';
import { getMySplashes, summarizeSplashes } from '@/lib/queries/splashes';
import { getMyTrail } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/** The Sessions tab (SPEC 5, H21e): the shelves, monthly and custom. */
export default async function SessionsPage({ searchParams }: PageProps<'/sessions'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const now = new Date();
  const today = todayIn(profile.timezone);
  const [ripples, categories, boards, sessions] = await Promise.all([
    getMyTrail(supabase, profile.id, profile.timezone),
    getMyCategories(supabase),
    getMySplashes(supabase, profile.id),
    getMySessions(supabase, profile.id),
  ]);
  const summaries = summarizeSplashes(boards, ripples, profile.timezone, now);
  const customCounts: Record<string, number> = {};
  for (const summary of summaries) {
    if (summary.sessionId)
      customCounts[summary.sessionId] = (customCounts[summary.sessionId] ?? 0) + 1;
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">
      <SessionsTab
        sessions={sessions}
        counts={Object.fromEntries(monthCounts(summaries, profile.timezone))}
        customCounts={customCounts}
        categories={categories}
        earliestYear={earliestYear(summaries, today, profile.timezone)}
        today={today}
        openNew={(await searchParams).new === '1'}
      />
    </main>
  );
}
