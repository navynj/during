import { redirect } from 'next/navigation';

import { DatePager } from '@/features/home-daily/date-pager';
import { getMyProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { todayIn, type IsoDate } from '@/lib/time';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // The middleware guarantees a session; a missing profile means the bootstrap
  // did not complete, so send the visitor back through it.
  if (!profile) redirect('/sign-in');

  const params = await searchParams;
  const requested = typeof params.d === 'string' && ISO_DATE.test(params.d) ? params.d : null;
  const date: IsoDate = requested ?? todayIn(profile.timezone);

  return (
    <main className="flex flex-1 flex-col">
      <DatePager date={date} />
      <TimeAxis />
    </main>
  );
}

function TimeAxis() {
  // S2 builds the axis itself (ripples placed by occurred_time, sinking
  // sections, scroll anchors). S0 ships the empty frame it will fill.
  return (
    <section className="border-pool-200 flex flex-1 items-center justify-center border-t py-16">
      {/* TODO(S5): replace with the designed zero-ripple empty state (SPEC 10). */}
      <p className="text-pool-500 text-center">Nothing yet today.</p>
    </section>
  );
}
