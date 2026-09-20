import { redirect } from 'next/navigation';

import { FocusScreen } from '@/features/focus/focus-screen';
import { getRunningSession } from '@/lib/queries/compose';
import { getMyProfile } from '@/lib/queries/profile';
import { startInstant } from '@/lib/ripple-kind';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'During · now' };

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

  return (
    <FocusScreen
      ripple={running}
      startedAt={startedAt.toISOString()}
      initialSeconds={Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))}
    />
  );
}
