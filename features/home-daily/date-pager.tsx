import Link from 'next/link';

import { formatPagerDate, shiftDate, type IsoDate } from '@/lib/time';

/**
 * SPEC 5: one pager governs the whole page, and it is the only date
 * navigation on it. The date lives in the URL so a day is linkable and the
 * server can resolve it against the author's timezone before rendering.
 *
 * Shape follows _docs/mockups/Home - Daily.png: the period on the left, the
 * day itself on the right with its weekday stacked under it.
 */
export function DatePager({ date }: { date: IsoDate }) {
  const { year, month, day, weekday, full } = formatPagerDate(date);

  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <p className="text-main-900 text-lg font-medium tracking-wide">
        {year} {month}
      </p>

      <div className="flex items-center gap-3">
        <PagerLink date={shiftDate(date, -1)} label="Previous day">
          ‹
        </PagerLink>

        <h1 className="text-main-900 flex flex-col items-center leading-none">
          <span className="sr-only">{full}</span>
          <span aria-hidden className="text-2xl font-semibold">
            {day}
          </span>
          <span aria-hidden className="text-xs font-semibold tracking-wide">
            {weekday}
          </span>
        </h1>

        <PagerLink date={shiftDate(date, 1)} label="Next day">
          ›
        </PagerLink>
      </div>
    </header>
  );
}

function PagerLink({
  date,
  label,
  children,
}: {
  date: IsoDate;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/?d=${date}`}
      aria-label={label}
      className="text-main-900 hover:bg-pool-100 flex h-8 w-8 items-center justify-center rounded-full text-lg"
    >
      {children}
    </Link>
  );
}
