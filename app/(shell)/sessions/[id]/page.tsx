import { notFound, redirect } from 'next/navigation';

import { Shelf } from '@/features/sessions/shelf';
import { customSessions, sessionSeats } from '@/features/sessions/shelves';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySessions } from '@/lib/queries/sessions';
import { getMySplashes, summarizeSplashes } from '@/lib/queries/splashes';
import { getMyTrail } from '@/lib/queries/trail';
import { createClient } from '@/lib/supabase/server';

/** A custom shelf's own screen (SPEC 5, H21e). Monthly shelves have none: they are Home. */
export default async function ShelfPage({ params }: PageProps<'/sessions/[id]'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  if (!profile) redirect('/sign-in');

  const { id } = await params;
  const now = new Date();
  const [ripples, categories, boards, sessions] = await Promise.all([
    getMyTrail(supabase, profile.id, profile.timezone),
    getMyCategories(supabase),
    getMySplashes(supabase, profile.id),
    getMySessions(supabase, profile.id),
  ]);
  const session = sessions.find((s) => s.id === id && s.kind === 'custom');
  if (!session) notFound();

  const summaries = summarizeSplashes(boards, ripples, profile.timezone, now);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">
      <Shelf
        session={session}
        seats={sessionSeats(summaries, session.id, profile.timezone)}
        // A lone block has no row to shelve yet; it is opened first (H21a).
        others={summaries.filter((s) => s.sessionId !== session.id && !s.orphan)}
        sessions={customSessions(sessions)}
        categories={categories}
      />
    </main>
  );
}
