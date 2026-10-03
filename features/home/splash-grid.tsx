'use client';

import { CommitRing } from '@/components/ui/waves';
import type { Seat } from '@/features/sessions/shelves';
import { SplashPill } from '@/features/splash/splash-pill';
import type { MyCategory } from '@/lib/queries/profile';

import { splashHref } from './scope';

/**
 * The post grid (`home-ground.png`): white pills in two columns, filled
 * left-right zigzag in strict coalesced-key order, **oldest at the top and
 * newest at the bottom** — time reads downward within a month (H21d). The
 * DOM order is the order; the grid's row-major flow is the zigzag.
 *
 * The pill a post was just dropped at gets the commit ripple once (SPEC 6).
 */
export function SplashGrid({
  seats,
  month,
  categories,
  ringAt,
}: {
  seats: Seat[];
  month: string;
  categories: MyCategory[];
  ringAt: string | null;
}) {
  return (
    <ol data-splash-grid className="grid grid-cols-2 gap-2">
      {seats.map(({ splash, date }) => {
        const ring = ringAt === splash.id;
        return (
          <li key={splash.id} data-seat={splash.id} className="relative min-w-0">
            {ring ? (
              <span
                aria-hidden
                data-commit-ripple
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <CommitRing size={160} contentSize={40} gap={8} once />
              </span>
            ) : null}
            <SplashPill
              splash={splash}
              range={{ start: date, end: date }}
              categories={categories}
              href={splashHref(splash.id, month)}
              ground="water"
              ring={ring}
            />
          </li>
        );
      })}
    </ol>
  );
}
