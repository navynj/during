import Link from 'next/link';

import { DurationChip } from '@/components/ui/chips/duration-chip';
import { WaveBundle, WaveLine } from '@/components/ui/waves';
import { monthHref } from '@/features/home/scope';
import { monthsBack } from '@/features/lanes/matrix';
import { depthSurface } from '@/lib/depth';
import { dayOf } from '@/lib/flow-key';
import { EMPTY } from '@/lib/empty-states';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { TrailDay } from '@/lib/queries/trail';
import { rippleDurationMinutes, rippleKind } from '@/lib/ripple-kind';
import { formatPagerDate } from '@/lib/time';

/**
 * The Locker Trail: my whole archive as one continuous backward scroll.
 *
 * **Archive browsing, not a feed.** The no-feed hypothesis (A1, A2) concerns
 * other people's content arriving unasked; this is my own, and the only way
 * through it is backwards. Nothing ever arrives at its top.
 *
 * Law 1's sinking applies here because this *is* a continuous scroll — one
 * surface, going deeper as you move back through it (H14, H21d: the ground
 * does not sink; the white scrolls still do).
 *
 * Sections are months, which is also what the gutter names. A row is a
 * block; tapping it opens its post's page at that block (H21), and a day
 * header opens that day's month on the ground.
 */
export function Trail({
  days,
  timeZone,
  origin = 'locker',
}: {
  days: TrailDay[];
  timeZone: string;
  /** Where a row's post page points back to: the Locker tab, or the day's month on the ground. */
  origin?: 'locker' | 'month';
}) {
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
          origin={origin}
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
  origin,
  surface,
  opensMonth,
}: {
  day: TrailDay;
  timeZone: string;
  origin: 'locker' | 'month';
  surface: string;
  opensMonth: boolean;
}) {
  const { year, month, day: number, weekday, full } = formatPagerDate(day.date);

  return (
    // The section carries its own ground, so the rows sit on the section
    // instead of punching white holes in it.
    <section data-trail-day={day.date} className="-mx-6 px-6" style={{ background: surface }}>
      <header className="sticky top-0 z-[1] py-3" style={{ background: surface }}>
        {opensMonth ? (
          <p className="text-main-900 pb-1 text-xs font-medium">
            {year} {month.toUpperCase()}
          </p>
        ) : null}
        {/* The header is the way back to the month itself: the Trail reads,
            and the ground is where a month is seen whole. */}
        <Link
          href={monthHref(day.date.slice(0, 7))}
          className="text-main-900 flex items-baseline gap-2"
        >
          <span className="sr-only">{full}</span>
          <span aria-hidden className="text-xl/none font-medium">
            {number}
          </span>
          <span aria-hidden className="text-xs/none font-medium">
            {weekday}
          </span>
        </Link>
      </header>

      <ol className="pb-4">
        {day.ripples.map((ripple) => (
          <TrailRow key={ripple.id} ripple={ripple} timeZone={timeZone} origin={origin} />
        ))}
      </ol>
    </section>
  );
}

/**
 * One block on the Trail: its clock in the gutter when it has one, its wave
 * on the left, its words and its post's title beside them. Opens its post's
 * page at the block (H21).
 */
function TrailRow({
  ripple,
  timeZone,
  origin,
}: {
  ripple: RippleWithCategory;
  timeZone: string;
  origin: 'locker' | 'month';
}) {
  const kind = rippleKind(ripple, timeZone);
  const minutes = kind === 'timed' ? rippleDurationMinutes(ripple, timeZone) : 0;
  const from = origin === 'locker' ? 'locker' : dayOf(ripple, timeZone).slice(0, 7);
  const href = `/splash/${ripple.splash_id ?? ripple.id}?from=${from}#block-${ripple.id}`;

  return (
    <li data-trail-row={ripple.id} data-trail-splash={ripple.splash_id ?? ripple.id}>
      <Link href={href} className="grid grid-cols-[2.75rem_2rem_1fr] items-start gap-x-3 py-2">
        <time className="text-main-900 pt-1 text-xs font-light tabular-nums">
          {ripple.occurred_time ? ripple.occurred_time.slice(0, 5) : ''}
        </time>
        <span className="flex flex-col items-center pt-1">
          {kind === 'timed' ? (
            <WaveBundle durationMinutes={minutes} emoji={ripple.category?.icon ?? undefined} />
          ) : (
            <>
              <span
                aria-hidden
                className="bg-pool-100 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm"
              >
                {ripple.category?.icon}
              </span>
              <WaveLine />
            </>
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-1 pt-1">
          {ripple.splash?.title ? (
            <span data-trail-splash className="text-main-900 truncate text-[10px] font-medium">
              {ripple.splash.title}
            </span>
          ) : null}
          {ripple.note ? <span className="text-ink text-sm">{ripple.note}</span> : null}
          {kind === 'timed' ? (
            <span>
              <DurationChip minutes={minutes} />
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
