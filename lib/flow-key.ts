import type { Ripple } from '@/lib/queries/ripples';
import { wallClockToInstant } from '@/lib/ripple-kind';
import { todayIn, type IsoDate } from '@/lib/time';

/**
 * The diary's own order (H20c): `COALESCE(occurred, created_at)`, newest
 * first, `created_at` as the tiebreak.
 *
 * An unannotated fragment — the default — has no `occurred_on` at all and
 * flows by when it was posted. An annotation is an instruction to place the
 * fragment where it happened, and it visibly moves there. Computed where it
 * is read, never stored: the sort_key plan was cancelled unbuilt.
 */
export type FlowKeyed = Pick<Ripple, 'occurred_on' | 'occurred_time' | 'created_at'>;

/** Just before midnight, author-local: where a date-only fragment sits. */
const END_OF_DAY = '23:59:59.999';

/**
 * The instant a fragment sorts at. A span sorts by its start; a date-only
 * fragment sorts at that date's end, because it belongs to the day and so sits
 * above everything posted during it; anything unannotated sits where it was
 * posted.
 */
export function flowInstant(ripple: FlowKeyed, timeZone: string): number {
  if (ripple.occurred_on === null) return Date.parse(ripple.created_at);
  if (ripple.occurred_time === null) {
    return wallClockToInstant(ripple.occurred_on, END_OF_DAY, timeZone).getTime();
  }
  return wallClockToInstant(ripple.occurred_on, ripple.occurred_time, timeZone).getTime();
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
 * The day a fragment belongs to, as Locker and Lanes read it (H20c): its
 * annotation's date, else the author-local date it was written. Never null —
 * every record was written on some day.
 */
export function dayOf(ripple: FlowKeyed, timeZone: string): IsoDate {
  return ripple.occurred_on ?? todayIn(timeZone, new Date(ripple.created_at));
}

/** `2026-08`, cut in the author's zone from the same key the flow sorts on. */
export function monthOf(ripple: FlowKeyed, timeZone: string): string {
  return todayIn(timeZone, new Date(flowInstant(ripple, timeZone))).slice(0, 7);
}

/** True when the fragment is placed on a day that has not happened yet. */
export function isFutureDated(ripple: FlowKeyed, timeZone: string, today: IsoDate): boolean {
  return ripple.occurred_on !== null && ripple.occurred_on > today;
}
