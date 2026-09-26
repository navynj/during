/**
 * The left column: a category badge centred on the rope, content rightward.
 * Widths follow `_docs/mockups/home-ripple-mode.png`: the rope at 32px from
 * the frame's edge, the note starting at 64px.
 */
export const ROW_GRID = 'grid grid-cols-[2rem_1fr] gap-x-4';

/** The badge column's width, which is also what a quiet badge floats at. */
export const BADGE_COLUMN = 'w-8';

/** Set on a month's list by `useRopeStart`: where its rope begins. */
export const ROPE_START_VAR = '--rope-top';

/**
 * The rope is the constant; rows and marks are what varies (SPEC 5). It is
 * one unbroken vertical line behind a month's list, never per-row segments,
 * so the line runs through a quiet stretch exactly as it runs under a full
 * row. It comes out from under the **first ripple's badge** — above that
 * there is only the month label, which the line must not cross — and every
 * later month's stretch runs from its top. Its x is the badge column's centre.
 */
export function Rope({ from }: { from: 'top' | 'first-badge' }) {
  return (
    <span
      aria-hidden
      data-rope
      data-rope-from={from}
      className="bg-pool-200 absolute bottom-0 left-4 w-px -translate-x-1/2"
      // The first stretch starts where the badge is measured to be. Until
      // then it is not drawn at all, rather than drawn from the top and moved.
      style={{ top: from === 'first-badge' ? `var(${ROPE_START_VAR}, 100%)` : 0 }}
    />
  );
}
