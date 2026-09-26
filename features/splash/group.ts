import { dayOf, flowInstant } from '@/lib/flow-key';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

/** A day's fragments, oldest first, under a small label. */
export type SplashDay = { date: IsoDate; ripples: RippleWithCategory[] };

/**
 * The story in time order: oldest first by the same key Home sorts on
 * (H20c), cut into days on the coalesced `occurred_on`. Home reads back;
 * a story reads forward.
 */
export function groupOldestFirst(members: RippleWithCategory[], timeZone: string): SplashDay[] {
  const sorted = [...members].sort((a, b) => flowInstant(a, timeZone) - flowInstant(b, timeZone));
  const days: SplashDay[] = [];
  for (const ripple of sorted) {
    const date = dayOf(ripple, timeZone);
    const last = days[days.length - 1];
    if (last && last.date === date) last.ripples.push(ripple);
    else days.push({ date, ripples: [ripple] });
  }
  return days;
}
