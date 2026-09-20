import { shiftDate, type IsoDate } from '@/lib/time';

/**
 * SPEC 7 law 1: the past sinks. Scrolling — or here, paging — into older days
 * steps the surface down the gray ramp. Subtle on purpose: it is a depth cue,
 * not a status colour, and it must never read as "this day is disabled".
 *
 * Today and anything ahead of it stay white: the future fades on the item,
 * never on the ground (H5).
 */
export type Depth = 0 | 1 | 2;

const SURFACE: Record<Depth, string> = {
  0: 'bg-white',
  1: 'bg-pool-100',
  2: 'bg-pool-200',
};

/** Days back at which the surface takes its next step down. */
const FIRST_STEP = 1;
const SECOND_STEP = 7;

export function depthFor(viewed: IsoDate, today: IsoDate): Depth {
  if (viewed >= today) return 0;

  let daysBack = 0;
  let cursor = today;
  while (cursor > viewed && daysBack < SECOND_STEP) {
    cursor = shiftDate(cursor, -1);
    daysBack += 1;
  }
  if (cursor > viewed) return 2;

  if (daysBack >= SECOND_STEP) return 2;
  return daysBack >= FIRST_STEP ? 1 : 0;
}

export function surfaceClass(depth: Depth): string {
  return SURFACE[depth];
}

/**
 * Where the page opens (SPEC 5): today at the current time, with the Add
 * ripple slot in view; any other day at the top, on its earliest record.
 * Moving the pager resets to these.
 */
export type Anchor = 'now' | 'top';

export function anchorFor(viewed: IsoDate, today: IsoDate): Anchor {
  return viewed === today ? 'now' : 'top';
}
