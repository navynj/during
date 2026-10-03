'use client';

import Link from 'next/link';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { dayOf } from '@/lib/flow-key';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

import { shortDay } from './block';

/** How many blocks the column reads back. */
export const RECENT_LIMIT = 30;

/** One block as the column reads it: its post's title, its words, its day. */
export type RecentItem = {
  id: string;
  splashId: string;
  title: string;
  note: string | null;
  day: IsoDate;
  createdAt: string;
};

/**
 * The recent column under the wide screen's composer (review): my latest
 * blocks, each under its post's title at display size with its words as a
 * preview, by day newest first and within a day newest posted first.
 *
 * **My own records, not a feed** (A1, A2, H19): nothing anyone else wrote
 * arrives here; it is the Trail's head, read beside the composer.
 */
export function recentItems(ripples: RippleWithCategory[], timeZone: string): RecentItem[] {
  return ripples
    .map((ripple) => ({
      id: ripple.id,
      splashId: ripple.splash_id ?? ripple.id,
      title: ripple.splash?.title?.trim() ?? '',
      note: ripple.note,
      day: dayOf(ripple, timeZone),
      createdAt: ripple.created_at,
    }))
    .sort((a, b) =>
      a.day < b.day ? 1 : a.day > b.day ? -1 : b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, RECENT_LIMIT);
}

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
