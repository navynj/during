import { redirect } from 'next/navigation';

import { FocusScreen } from '@/features/focus/focus-screen';
import { getInnerRipples, getRunningSession, runningBreak } from '@/lib/queries/compose';
import { getRipplesForDate, splitByRegion } from '@/lib/queries/ripples';
import { todayIn } from '@/lib/time';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { startInstant } from '@/lib/ripple-kind';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'During · now' };

/** Whole seconds since an instant, resolved once per request. */
function secondsSince(instant: Date): number {
  return Math.max(0, Math.floor((Date.now() - instant.getTime()) / 1000));
}

/**
 * The running record's own screen. Outside the shell group on purpose: it is
 * a full surface, so it carries no tab bar.
 *
 * Guarded by the data rather than by a flag — with no timer running there is
 * nothing for this screen to be, so it sends you back to the day.
 */
export default async function NowPage() {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const running = await getRunningSession(supabase, profile.id);
  if (!running) redirect('/');

  const startedAt = startInstant(running, profile.timezone)!;
  const inner = await getInnerRipples(supabase, [running.id]);
  const onBreak = runningBreak(inner);
  const breakStartedAt = onBreak ? startInstant(onBreak, profile.timezone) : null;

  // The sheet opens over this surface, so it needs the same context Home
  // gives it — fetched here rather than navigating to fetch it.
  const date = todayIn(profile.timezone);
  const [categories, today] = await Promise.all([
    getMyCategories(supabase),
    getRipplesForDate(supabase, profile.id, date),
  ]);

  return (
    <FocusScreen
      ripple={running}
      startedAt={startedAt.toISOString()}
      initialSeconds={secondsSince(startedAt)}
      openBreak={onBreak?.id ?? null}
      breakStartedAt={breakStartedAt?.toISOString() ?? null}
      breakInitialSeconds={breakStartedAt ? secondsSince(breakStartedAt) : 0}
      sheetContext={{
        categories,
        ripples: splitByRegion(today).timeline,
        running,
        timeZone: profile.timezone,
        date,
      }}
    />
  );
}
