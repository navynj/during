'use client';

import { CommitRing } from '@/components/ui/waves';
import type { Seat } from '@/features/sessions/shelves';
import { SplashPill } from '@/features/splash/splash-pill';
import type { MyCategory } from '@/lib/queries/profile';

import { splashHref } from './scope';

/**
 * The post grid (`home-ground.png`): pills sized to their titles — short
 * ones short, long ones long — wrapping left to right like tags, in strict
 * coalesced-key order, **oldest at the top and newest at the bottom** — time
 * reads downward within a month (H21d). The DOM order is the order; the wrap
 * is the layout.
 *
 * A pill reads its post's date — or its period, when the block it sits at
 * spans days (review). The pill a post was just dropped at gets the commit
 * ripple once (SPEC 6).
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
    <ol data-splash-grid className="flex flex-wrap gap-2">
      {seats.map(({ splash, span }) => {
        const ring = ringAt === splash.id;
        return (
          <li key={splash.id} data-seat={splash.id} className="relative max-w-full">
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
              range={span}
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
