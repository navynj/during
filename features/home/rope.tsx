/**
 * The left column: a category badge centred on the rope, content rightward.
 * Widths follow `_docs/mockups/home-ripple-mode.png`: the rope at 32px from
 * the frame's edge, the note starting at 64px.
 */
export const ROW_GRID = 'grid grid-cols-[2rem_1fr] gap-x-4';

/** The badge column's width, which is also what a quiet badge sits in. */
export const BADGE_COLUMN = 'w-8';

/**
 * Two columns, two independent stacks (SPEC 5): a month lays its ripples in
 * the left list and its splashes in the right, each stacking from the top of
 * the month, and neither column waits for the other. The flow's order holds
 * within a column; a badge never sits lower because a board was created
 * between two postings.
 */
/** Ripple mode: the rope-and-content column, then room for a quiet cluster. */
export const COLUMNS_RIPPLE_MODE = 'grid-cols-[minmax(0,1fr)_4.5rem]';
/** Splash mode: the badge column, then the entries. */
export const COLUMNS_SPLASH_MODE = 'grid-cols-[2rem_minmax(0,1fr)]';
/** A quiet splash cluster: 6rem, 1.5rem of it in the gutter, 4.5rem in its column. */
export const QUIET_CLUSTER = 'w-24 -mr-6';

/** Set on a list by `useRopeSpan`: where its rope begins and ends. */
export const ROPE_START_VAR = '--rope-top';
export const ROPE_END_VAR = '--rope-bottom';

/**
 * The rope is the constant; rows and marks are what varies (SPEC 5). It is
 * one unbroken vertical line behind a list, never per-row segments, so the
 * line runs through a quiet stretch exactly as it runs under a full row. It
 * spans the seats on it and nothing more: from the centre of the first (the
 * ghost ring at the head of the newest month, else a month's first badge) to
 * the centre of the last, so it never crosses the month label above it and
 * never trails past the last item. Its x is the badge column's centre.
 */
export function Rope() {
  return (
    <span
      aria-hidden
      data-rope
      className="bg-pool-200 absolute left-4 w-px -translate-x-1/2"
      // Both ends are where the seats are measured to be. Until measured
      // the rope is not drawn at all, rather than drawn long and cut.
      style={{ top: `var(${ROPE_START_VAR}, 100%)`, bottom: `var(${ROPE_END_VAR}, 0px)` }}
    />
  );
}
