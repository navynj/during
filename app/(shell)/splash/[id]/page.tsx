import { notFound, redirect } from 'next/navigation';

import { monthHref } from '@/features/home/scope';
import { monthName } from '@/features/sessions/shelves';
import { SplashPage, type Origin } from '@/features/splash/splash-page';
import { summarizeOrphan, summarizeSplash } from '@/features/splash/summary';
import { flowInstant } from '@/lib/flow-key';
import { signOwnMedia } from '@/lib/media';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySessions } from '@/lib/queries/sessions';
import { getMySplashes } from '@/lib/queries/splashes';
import { getMyTrail } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';
import { customSessions } from '@/features/sessions/shelves';

const MONTH = /^\d{4}-\d{2}$/;

/** Where the back chip points, from `?from=`: a month, a shelf, the Locker. */
function originOf(
  from: string | undefined,
  sessions: { id: string; title: string }[],
  today: string,
): Origin {
  if (from && MONTH.test(from)) return { label: monthName(from), href: monthHref(from) };
  if (from?.startsWith('session:')) {
    const session = sessions.find((s) => s.id === from.slice('session:'.length));
    if (session) return { label: session.title, href: `/sessions/${session.id}` };
  }
  if (from === 'locker') return { label: 'Locker', href: '/locker' };
  if (from?.startsWith('/')) return { label: 'Back', href: from };
  return { label: monthName(today.slice(0, 7)), href: monthHref(today.slice(0, 7)) };
}

/**
 * A post's page (SPEC 5, H21c): the white page above the water. Under Home
 * in the shell, so the tab bar keeps Home lit; RLS decides whether the post
 * exists for this viewer at all. A splashless block opens here too, as an
 * untitled post of one.
 */
export default async function SplashRoute({ params, searchParams }: PageProps<'/splash/[id]'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const { id } = await params;
  const from = (await searchParams).from;
  const now = new Date();
  const today = todayIn(profile.timezone);

  const [ripples, categories, boards, sessions] = await Promise.all([
    getMyTrail(supabase, profile.id, profile.timezone),
    getMyCategories(supabase),
    getMySplashes(supabase, profile.id),
    getMySessions(supabase, profile.id),
  ]);

  const board = boards.find((b) => b.id === id) ?? null;
  const lone = board ? null : (ripples.find((r) => r.id === id && r.splash_id === null) ?? null);
  if (!board && !lone) notFound();

  const blocks = (board ? ripples.filter((r) => r.splash_id === id) : [lone!]).sort(
    (a, b) =>
      flowInstant(a, profile.timezone) - flowInstant(b, profile.timezone) ||
      a.created_at.localeCompare(b.created_at),
  );
  const summary = board
    ? summarizeSplash(board, blocks, profile.timezone, now)
    : summarizeOrphan(lone!, profile.timezone, now);

  const { data: lockRows } = await supabase
    .from('ripple_audience')
    .select('ripple_id')
    .eq('target_type', 'lock')
    .in(
      'ripple_id',
      blocks.length ? blocks.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000'],
    );

  // A photo that could not be signed is a placeholder, never a failed page.
  const signed = await signOwnMedia(blocks.flatMap((r) => r.media));
  const photos = Object.fromEntries(
    blocks
      .filter((r) => r.media.length > 0)
      .map((r) => [r.id, r.media.map((path) => signed[path] ?? null)]),
  );

  const custom = customSessions(sessions);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">
      <SplashPage
        splash={summary}
        blocks={blocks}
        photos={photos}
        lockedIds={(lockRows ?? []).map((row) => row.ripple_id)}
        categories={categories}
        sessions={custom}
        origin={originOf(typeof from === 'string' ? from : undefined, custom, today)}
        timeZone={profile.timezone}
        today={today}
      />
    </main>
  );
}
