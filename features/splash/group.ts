import { dayOf, flowInstant } from '@/lib/flow-key';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

/** A day's fragments under a small label, in the story's order. */
export type SplashDay = { date: IsoDate; ripples: RippleWithCategory[] };

/** Newest first, like Home; oldest first reads the story forward. */
export type StoryOrder = 'newest' | 'oldest';

/**
 * The story by the same key Home sorts on (H20c), newest first by default
 * and reversible, cut into days on the coalesced `occurred_on`.
 */
export function groupStory(
  members: RippleWithCategory[],
  timeZone: string,
  order: StoryOrder = 'newest',
): SplashDay[] {
  const sign = order === 'newest' ? -1 : 1;
  const sorted = [...members].sort(
    (a, b) => sign * (flowInstant(a, timeZone) - flowInstant(b, timeZone)),
  );
  const days: SplashDay[] = [];
  for (const ripple of sorted) {
    const date = dayOf(ripple, timeZone);
    const last = days[days.length - 1];
    if (last && last.date === date) last.ripples.push(ripple);
    else days.push({ date, ripples: [ripple] });
  }
  return days;
}
