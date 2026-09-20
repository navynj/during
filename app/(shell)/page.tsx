import { redirect } from 'next/navigation';

import { DatePager } from '@/features/home-daily/date-pager';
import { DailyNoteArea } from '@/features/home-daily/daily-note-area';
import { anchorFor, depthFor, surfaceClass } from '@/features/home-daily/depth';
import { motionFromSearchParams } from '@/features/home-daily/motion-override';
import { ScrollAnchor } from '@/features/home-daily/scroll-anchor';
import { ADD_RIPPLE_SLOT_ID, TimeAxis } from '@/features/home-daily/time-axis';
import { getRipplesForDate, splitByRegion } from '@/lib/queries/ripples';
import { getMyProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { todayIn, type IsoDate } from '@/lib/time';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // The proxy guarantees a session; a missing profile means the bootstrap did
  // not complete, so send the visitor back through it.
  if (!profile) redirect('/sign-in');

  const params = await searchParams;
  const today = todayIn(profile.timezone);
  const requested = typeof params.d === 'string' && ISO_DATE.test(params.d) ? params.d : null;
  const date: IsoDate = requested ?? today;

  const ripples = await getRipplesForDate(supabase, profile.id, date);
  const { notes, timeline } = splitByRegion(ripples);

  const depth = depthFor(date, today);
  const surface = surfaceClass(depth);
  const anchor = anchorFor(date, today);
  const motion = motionFromSearchParams(params.motion);

  return (
    <main className={`flex flex-1 flex-col ${surface} -mx-6 px-6 transition-colors`}>
      <DatePager date={date} />
      <DailyNoteArea notes={notes} />
      <div className="bg-main-900 h-px" />
      <TimeAxis
        ripples={timeline}
        timeZone={profile.timezone}
        now={new Date()}
        motion={motion}
        surface={surface}
      />

      {/* Keyed on the date so a pager move remounts it and resets the anchor. */}
      <ScrollAnchor key={date} anchor={anchor} targetId={ADD_RIPPLE_SLOT_ID} />
    </main>
  );
}
