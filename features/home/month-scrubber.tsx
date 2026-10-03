import Link from 'next/link';

import { shortMonthName } from '@/features/sessions/shelves';

import { monthHref } from './scope';

/** How far the receding months fade, and the floor they never go under. */
const FADE_STEP = 0.18;
const FADE_FLOOR = 0.25;

/**
 * The month scrubber (`home-ground.png`, H21d): the scoped month large, the
 * others small and receding with distance — the past fading along the
 * scrubber is where sinking lives on the ground. Each month carries its post
 * count small, when it has any. Tap = scope, never scroll-jump (H21h).
 *
 * Newest first, as the mockup lays it: the scoped month at the left when it
 * is the current one, older months trailing rightward.
 */
export function MonthScrubber({
  months,
  counts,
  scoped,
}: {
  /** Newest first. */
  months: string[];
  counts: Map<string, number>;
  scoped: string;
}) {
  const at = months.indexOf(scoped);
  return (
    <nav aria-label="Month" data-month-scrubber className="no-scrollbar overflow-x-auto pt-5 pb-3">
      <ol className="flex items-end gap-5">
        {months.map((month, index) => {
          const current = month === scoped;
          const distance = at === -1 ? index : Math.abs(index - at);
          const opacity = current ? 1 : Math.max(FADE_FLOOR, 1 - FADE_STEP * distance);
          const count = counts.get(month) ?? 0;
          const showsYear = index === 0 || month.slice(0, 4) !== months[index - 1].slice(0, 4);
          return (
            <li key={month} className="flex shrink-0 flex-col" style={{ opacity }}>
              {showsYear ? (
                <span className="text-[10px]/none font-medium">{month.slice(0, 4)}</span>
              ) : (
                <span className="text-[10px]/none">&nbsp;</span>
              )}
              <Link
                href={monthHref(month)}
                aria-current={current ? 'true' : undefined}
                data-scrub-month={month}
                className={`flex items-baseline gap-0.5 ${
                  current ? 'text-2xl/none font-semibold' : 'text-base/none font-medium'
                }`}
              >
                {shortMonthName(month)}
                {count > 0 ? (
                  <span data-month-count className="text-[10px]/none font-normal tabular-nums">
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
