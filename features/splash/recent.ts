import { dayOf } from '@/lib/flow-key';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

/** How many blocks the recent column reads back. */
export const RECENT_LIMIT = 30;

/** One block as the recent column reads it: its post's title, its words, its day. */
export type RecentItem = {
  id: string;
  splashId: string;
  title: string;
  note: string | null;
  day: IsoDate;
  createdAt: string;
};

/**
 * The recent column's items (review): my latest blocks by day newest first
 * and within a day newest posted first. Pure, so the server layout can
 * derive it; the column that renders it is a client component.
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
