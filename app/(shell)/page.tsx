import { redirect } from 'next/navigation';

import { DatePager } from '@/features/home-daily/date-pager';
import { DailyNoteArea } from '@/features/home-daily/daily-note-area';
import { anchorFor } from '@/features/home-daily/depth';
import { ScrollAnchor } from '@/features/home-daily/scroll-anchor';
import { ADD_RIPPLE_SLOT_ID, TimeAxis } from '@/features/home-daily/time-axis';
import { LanesStrip } from '@/features/home-daily/lanes-strip';
import { SheetHost } from '@/features/input-sheet/sheet-host';
import { getRunningSession } from '@/lib/queries/compose';
import { getRipplesForDate, splitByRegion } from '@/lib/queries/ripples';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
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

  const [ripples, categories, running] = await Promise.all([
    getRipplesForDate(supabase, profile.id, date),
    getMyCategories(supabase),
    getRunningSession(supabase, profile.id),
  ]);
  const { notes, timeline } = splitByRegion(ripples);

  const countsByCategory = ripples.reduce<Record<string, number>>((counts, ripple) => {
    counts[ripple.category_id] = (counts[ripple.category_id] ?? 0) + 1;
    return counts;
  }, {});

  const anchor = anchorFor(date, today);

  return (
    <main className="flex min-h-[calc(100dvh-var(--tab-bar-h))] flex-1 flex-col">
      {/* The day takes the slack, so on a quiet day the strip still sits at the
          bottom instead of floating halfway up the screen. */}
      <div className="flex-1">
        <DatePager date={date} />
        <DailyNoteArea notes={notes} />
        <div className="bg-main-900 h-px" />
        <TimeAxis ripples={timeline} timeZone={profile.timezone} now={new Date()} />
      </div>

      <LanesStrip categories={categories} countsByCategory={countsByCategory} />

      {/* Keyed on the date so a pager move remounts it and resets the anchor. */}
      <ScrollAnchor key={date} anchor={anchor} targetId={ADD_RIPPLE_SLOT_ID} />

      <SheetHost
        context={{ categories, ripples: timeline, running, timeZone: profile.timezone, date }}
        openWithParent={
          typeof params.session === 'string' && running?.id === params.session
            ? params.session
            : undefined
        }
      />
    </main>
  );
}
