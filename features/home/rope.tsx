/**
 * The left column: a category badge centred on the rope, content rightward.
 * Widths follow `_docs/mockups/home-ripple-mode.png`: the rope at 32px from
 * the frame's edge, the note starting at 64px.
 */
export const ROW_GRID = 'grid grid-cols-[2rem_1fr] gap-x-4';

/** The badge column's width, which is also what a quiet badge floats at. */
export const BADGE_COLUMN = 'w-8';

/**
 * Two columns sharing one vertical space (SPEC 5): every row floats on its
 * own side, cleared against its own side, so each column stacks from the top
 * and no row sits higher than the row before it in the flow. The widths are
 * paired so a row and a mark always fit beside each other, with a little
 * slack for rounding.
 */
/** A quiet splash cluster: 6rem, 1.5rem of it in the gutter. */
export const QUIET_CLUSTER = 'w-24 -mr-6';
/** A full ripple row: the column, less the cluster's 4.5rem and slack. */
export const BESIDE_QUIET_CLUSTER = 'w-[calc(100%-5rem)]';
/** A full splash entry: at most the column, less the badge column, its gap and slack. */
export const BESIDE_BADGE_COLUMN = 'max-w-[calc(100%-3.25rem)]';

/** Set on a list by `useRopeStart`: where its rope begins. */
export const ROPE_START_VAR = '--rope-top';

/**
 * The rope is the constant; rows and marks are what varies (SPEC 5). It is
 * one unbroken vertical line behind a list, never per-row segments, so the
 * line runs through a quiet stretch exactly as it runs under a full row. It
 * comes out from under the **first ripple's badge** — above that there is
 * only a label or the ghost, which the line must not cross — and every later
 * month's stretch runs from its top. Its x is the badge column's centre.
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
