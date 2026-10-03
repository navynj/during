import type { Ripple } from '@/lib/queries/ripples';
import { wallClockToInstant } from '@/lib/ripple-kind';
import { todayIn, type IsoDate } from '@/lib/time';

/**
 * The diary's own order (H20c, H21f): `COALESCE(occurred, the post's
 * declared date, created_at)`, `created_at` as the tiebreak.
 *
 * An unannotated block — the default — rests at its post's declared date if
 * the post declares one, else where it was written. An annotation is an
 * instruction to place the block where it happened, and it always wins: a
 * declaration is a default, never an override. Computed where it is read,
 * never stored: the sort_key plan was cancelled unbuilt.
 */
export type FlowKeyed = Pick<Ripple, 'occurred_on' | 'occurred_time' | 'created_at'> & {
  /** The post this block composes, where the query joined it. */
  splash?: { declared_start: string | null } | null;
};

/** Just before midnight, author-local: where a date-only block sits. */
export const END_OF_DAY = '23:59:59.999';

/** The date a block rests on without an annotation: its post's declared date. */
function restingDate(ripple: FlowKeyed): IsoDate | null {
  return ripple.occurred_on ?? ripple.splash?.declared_start ?? null;
}

/**
 * The instant a block sorts at. A span sorts by its start; a date-only block,
 * or one resting at its post's declared date, sorts at that date's end,
 * because it belongs to the day and so sits above everything posted during
 * it; anything else sits where it was posted.
 */
export function flowInstant(ripple: FlowKeyed, timeZone: string): number {
  const date = restingDate(ripple);
  if (date === null) return Date.parse(ripple.created_at);
  if (ripple.occurred_on === null || ripple.occurred_time === null) {
    return wallClockToInstant(date, END_OF_DAY, timeZone).getTime();
  }
  return wallClockToInstant(date, ripple.occurred_time, timeZone).getTime();
}

/** Newest first; a later posting wins a tie. */
export function compareNewestFirst(a: FlowKeyed, b: FlowKeyed, timeZone: string): number {
  const byKey = flowInstant(b, timeZone) - flowInstant(a, timeZone);
  if (byKey !== 0) return byKey;
  return Date.parse(b.created_at) - Date.parse(a.created_at);
}

export function sortNewestFirst<T extends FlowKeyed>(ripples: T[], timeZone: string): T[] {
  return [...ripples].sort((a, b) => compareNewestFirst(a, b, timeZone));
}

/**
 * The day a block belongs to, as Locker and Lanes read it (H20c, H21f): its
 * annotation's date, else its post's declared date, else the author-local
 * date it was written. Never null — every record was written on some day.
 */
export function dayOf(ripple: FlowKeyed, timeZone: string): IsoDate {
  return restingDate(ripple) ?? todayIn(timeZone, new Date(ripple.created_at));
}

/** `2026-08`, cut in the author's zone from the same key the flow sorts on. */
export function monthOf(ripple: FlowKeyed, timeZone: string): string {
  return todayIn(timeZone, new Date(flowInstant(ripple, timeZone))).slice(0, 7);
}

/** True when the block is placed on a day that has not happened yet. */
export function isFutureDated(ripple: FlowKeyed, timeZone: string, today: IsoDate): boolean {
  return ripple.occurred_on !== null && ripple.occurred_on > today;
}
