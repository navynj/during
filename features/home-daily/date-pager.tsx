import Link from 'next/link';

import { formatPagerDate, shiftDate, type IsoDate } from '@/lib/time';

/**
 * SPEC 5: one pager governs the whole page, and it is the only date
 * navigation on it. The date lives in the URL so a day is linkable and the
 * server can resolve it against the author's timezone before rendering.
 */
export function DatePager({ date }: { date: IsoDate }) {
  const { day, weekday, month } = formatPagerDate(date);

  return (
    <header className="flex flex-col gap-2 py-6">
      <p className="text-main-900 text-sm font-semibold tracking-wide">{month}</p>
      <div className="flex items-center gap-4">
        <PagerLink date={shiftDate(date, -1)} label="Previous day">
          ‹
        </PagerLink>
        <h1 className="text-ink text-2xl font-bold">
          {day} <span className="text-ink">{weekday}</span>
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
      className="text-pool-500 hover:bg-pool-100 flex h-8 w-8 items-center justify-center rounded-full text-lg"
    >
      {children}
    </Link>
  );
}
