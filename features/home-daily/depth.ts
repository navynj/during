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
 * White by default, because Home Daily pages one day at a time and keeps its
 * ground at every date: law 1's sinking is about *sections* within a
 * continuous scroll, and tinting a whole page made a past day look disabled
 * rather than deep (H14).
 *
 * The Trail *is* such a scroll, so its sections set `--row-surface` and the
 * same row follows them down. A row never picks its own depth — the surface
 * it sits on does.
 */
export const ROW_SURFACE = 'bg-[var(--row-surface,#ffffff)]';
