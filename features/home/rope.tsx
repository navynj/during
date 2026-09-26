/**
 * The left column: a category badge centred on the rope, content rightward.
 * Widths follow `_docs/mockups/home-ripple-mode.png`: the rope at 32px from
 * the frame's edge, the note starting at 64px.
 */
export const ROW_GRID = 'grid grid-cols-[2rem_1fr] gap-x-4';

/** The badge column's width, which is also what a quiet badge floats at. */
export const BADGE_COLUMN = 'w-8';

/**
 * The rope is the constant; rows and marks are what varies (SPEC 5). It is
 * one unbroken vertical line behind the whole flow, never per-row segments:
 * a month's header and its list each carry one, butted together, so the line
 * runs through a quiet stretch exactly as it runs under a full row. Its x is
 * the badge column's centre.
 */
export function Rope() {
  return (
    <span
      aria-hidden
      data-rope
      className="bg-pool-200 absolute inset-y-0 left-4 w-px -translate-x-1/2"
    />
  );
}
