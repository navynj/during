'use client';

import Link from 'next/link';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import type { IsoDate } from '@/lib/time';

import { shortDay } from './block';
import type { RecentItem } from './recent';

export type { RecentItem };
export { recentItems, RECENT_LIMIT } from './recent';

/**
 * The recent column under the wide screen's composer (review): my latest
 * blocks, each under its post's title at display size with its words as a
 * preview. The post just dropped heads it at once.
 */
export function RecentBlocks({ items, today }: { items: RecentItem[]; today: IsoDate }) {
  const { pendingDrop } = useInputSheet();
  // The post just dropped heads the column at once (CLAUDE.md, the
  // principle), until the re-read carries the real block in.
  const seated =
    pendingDrop && !items.some((item) => item.splashId === pendingDrop.splash.id)
      ? [
          {
            id: `${pendingDrop.splash.id}-first`,
            splashId: pendingDrop.splash.id,
            title: pendingDrop.splash.title.trim(),
            note: pendingDrop.note,
            day: pendingDrop.splash.blocks[0]?.day ?? today,
            createdAt: pendingDrop.splash.createdAt,
          },
          ...items,
        ]
      : items;

  if (seated.length === 0) return null;

  return (
    <ol data-recent-blocks className="flex w-full max-w-xl flex-col gap-6">
      {seated.map((item, index) => {
        const opensDay = index === 0 || seated[index - 1].day !== item.day;
        return (
          <li key={item.id} data-recent-block={item.id} className="flex flex-col gap-1">
            {opensDay ? (
              <span data-recent-day className="text-[11px] font-medium text-white/60 tabular-nums">
                {item.day === today ? 'Today' : shortDay(item.day)}
              </span>
            ) : null}
            <Link
              href={`/splash/${item.splashId}?from=${item.day.slice(0, 7)}`}
              className="flex flex-col gap-1"
            >
              <span data-recent-title className="text-xl/snug font-semibold text-white">
                {item.title || <span className="opacity-40">Untitled</span>}
              </span>
              {item.note ? (
                <span
                  data-recent-preview
                  className="line-clamp-3 text-sm/relaxed font-light text-white/80"
                >
                  {item.note}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
