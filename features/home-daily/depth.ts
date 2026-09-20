import type { IsoDate } from '@/lib/time';

/**
 * Where the page opens (SPEC 5): today at the current time, with the Add
 * ripple slot in view; any other day at the top, on its earliest record.
 * Moving the pager resets to these.
 */
export type Anchor = 'now' | 'top';

export function anchorFor(viewed: IsoDate, today: IsoDate): Anchor {
  return viewed === today ? 'now' : 'top';
}

/**
 * The ground behind a Ripple's waves, so the rope passes behind the stack
 * rather than through it.
 *
 * A constant, not a depth ramp. SPEC 7 law 1's sinking is about *sections*
 * within a scroll — going deeper as you move back through one continuous
 * surface. Home Daily pages one day at a time, so there are no sections to
 * sink: tinting the whole page made a past day look disabled rather than deep,
 * and the waves on it, which are full-strength by H9a, looked stranded.
 */
export const ROW_SURFACE = 'bg-white';
