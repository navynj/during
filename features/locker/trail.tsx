import Link from 'next/link';

import { DailyNoteRow } from '@/features/home-daily/daily-note-row';
import { RippleRow } from '@/features/home-daily/ripple-row';
import { monthsBack } from '@/features/lanes/matrix';
import { depthSurface } from '@/lib/depth';
import { EMPTY } from '@/lib/empty-states';
import { splitByRegion } from '@/lib/queries/ripples';
import type { TrailDay } from '@/lib/queries/trail';
import { formatPagerDate } from '@/lib/time';

/**
 * The Locker Trail: my whole archive as one continuous backward scroll.
 *
 * **Archive browsing, not a feed.** The no-feed hypothesis (A1, A2) concerns
 * other people's content arriving unasked; this is my own, and the only way
 * through it is backwards. Nothing ever arrives at its top.
 *
 * Law 1's sinking applies here because this *is* a continuous scroll — one
 * surface, going deeper as you move back through it. Home Daily is exempt for
 * the opposite reason (H14): it pages, so there are no sections to sink.
 *
 * Sections are months, which is also what the gutter names. Rows are the same
 * grammar as Home, and tapping one opens the same detail sheet.
 */
export function Trail({ days, timeZone, now }: { days: TrailDay[]; timeZone: string; now: Date }) {
  if (days.length === 0) {
    return <p className="text-pool-500 py-16 text-center text-sm">{EMPTY.trail}</p>;
  }

  const newest = days[0].date;

  return (
    <div className="flex-1">
      {days.map((day, index) => (
        <DaySection
          key={day.date}
          day={day}
          timeZone={timeZone}
          now={now}
          surface={depthSurface(monthsBack(newest, day.date))}
          opensMonth={day.date.slice(0, 7) !== days[index - 1]?.date.slice(0, 7)}
        />
      ))}
    </div>
  );
}

function DaySection({
  day,
  timeZone,
  now,
  surface,
  opensMonth,
}: {
  day: TrailDay;
  timeZone: string;
  now: Date;
  surface: string;
  opensMonth: boolean;
}) {
  const { year, month, day: number, weekday, full } = formatPagerDate(day.date);
  // The same two regions Home has: a record with no time belongs to the day
  // without claiming a position on its axis (SPEC 5.3), so it heads the
  // section rather than being drawn as a row with no clock.
  const { notes, timeline } = splitByRegion(day.ripples);

  return (
    // The section carries its own ground, and the rows read it back through
    // --row-surface, so the wave backdrops sit on the section instead of
    // punching white holes in it.
    <section
      data-trail-day={day.date}
      className="-mx-6 px-6"
      style={{ background: surface, ['--row-surface' as string]: surface }}
    >
      <header className="sticky top-0 z-[1] py-3" style={{ background: surface }}>
        {opensMonth ? (
          <p className="text-main-900 pb-1 text-xs font-medium">
            {year} {month.toUpperCase()}
          </p>
        ) : null}
        {/* The header is the way back to the day itself: the Trail reads, and
            Home Daily is where a day is worked on. */}
        <Link href={`/?d=${day.date}`} className="text-main-900 flex items-baseline gap-2">
          <span className="sr-only">{full}</span>
          <span aria-hidden className="text-xl/none font-medium">
            {number}
          </span>
          <span aria-hidden className="text-xs/none font-medium">
            {weekday}
          </span>
        </Link>
      </header>

      {notes.length > 0 ? (
        <div className="flex flex-col gap-1 pb-2">
          {notes.map((note) => (
            <DailyNoteRow key={note.id} note={note} />
          ))}
        </div>
      ) : null}

      <ol className="pb-4">
        {timeline.map((ripple) => (
          <RippleRow key={ripple.id} ripple={ripple} timeZone={timeZone} now={now} />
        ))}
      </ol>
    </section>
  );
}
