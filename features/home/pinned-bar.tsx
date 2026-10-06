import Link from 'next/link';

import type { SplashSummary } from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';

import { splashHref } from './scope';

/**
 * The pinned bar (H21g): pinned posts as compact chips, in ink — the
 * selection channel — above the tab bar, persisting across scrubbing, with
 * horizontal overflow. A chip opens the post in its editor. Absent when
 * nothing is pinned: no empty strip.
 */
export function PinnedBar({
  pinned,
  categories,
  month,
}: {
  pinned: SplashSummary[];
  categories: MyCategory[];
  month: string;
}) {
  if (pinned.length === 0) return null;
  return (
    <nav aria-label="Pinned" data-pinned-bar className="bg-ink -mx-6 px-6 py-2 text-white">
      <ol className="no-scrollbar flex gap-2 overflow-x-auto">
        {pinned.map((splash) => {
          const lane = categories.find((c) => c.id === splash.laneIds[0]) ?? null;
          return (
            <li key={splash.id} className="shrink-0">
              <Link
                href={splashHref(splash.id, month)}
                data-pinned-chip={splash.id}
                className="flex h-7 max-w-48 items-center gap-1 rounded-full bg-white/10 px-3 text-xs font-medium"
              >
                {lane?.icon ? <span aria-hidden>{lane.icon}</span> : null}
                <span className="truncate">
                  {splash.title.trim() || splash.ghostTitle || 'Untitled'}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
