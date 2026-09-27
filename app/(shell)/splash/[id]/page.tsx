import { notFound, redirect } from 'next/navigation';

import { RippleSheetHost } from '@/features/ripple-sheet/sheet-host';
import { SplashScreen } from '@/features/splash/splash-screen';
import { summarizeSplash } from '@/features/splash/summary';
import { signOwnMedia } from '@/lib/media';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySplashes, summarizeSplashes } from '@/lib/queries/splashes';
import { getMyTrail } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * A board's screen (SPEC 5). Under Home in the shell, so the tab bar keeps
 * Home lit; RLS decides whether the board exists for this viewer at all.
 */
export default async function SplashPage({ params }: PageProps<'/splash/[id]'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const { id } = await params;
  const now = new Date();
  const today = todayIn(profile.timezone);

  const [ripples, categories, boards] = await Promise.all([
    getMyTrail(supabase, profile.id, profile.timezone),
    getMyCategories(supabase),
    getMySplashes(supabase, profile.id),
  ]);
  const board = boards.find((b) => b.id === id);
  if (!board) notFound();

  const members = ripples.filter((r) => r.splash_id === id);
  const splash = summarizeSplash(board, members, profile.timezone, now);
  const splashes = summarizeSplashes(boards, ripples, profile.timezone, now);

  const { data: lockRows } = await supabase
    .from('ripple_audience')
    .select('ripple_id')
    .eq('target_type', 'lock')
    .in(
      'ripple_id',
      members.length ? members.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000'],
    );

  // A photo that could not be signed is a placeholder, never a failed page.
  const signed = await signOwnMedia(members.flatMap((r) => r.media));
  const photos = Object.fromEntries(
    members
      .filter((r) => r.media.length > 0)
      .map((r) => [r.id, r.media.map((path) => signed[path] ?? null)]),
  );

  return (
    <RippleSheetHost
      ripples={members}
      lockedIds={(lockRows ?? []).map((row) => row.ripple_id)}
      sheetContext={{ categories, splashes, timeZone: profile.timezone, today }}
    >
      <main className="flex min-h-[calc(100dvh-var(--tab-bar-h))] flex-1 flex-col">
        <SplashScreen
          splash={splash}
          members={members}
          photos={photos}
          timeZone={profile.timezone}
          today={today}
        />
      </main>
    </RippleSheetHost>
  );
}
