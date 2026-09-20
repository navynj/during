/**
 * One grid for every row on the axis — Ripples and the Add ripple slot alike.
 *
 * Shared because the rope has to run through the centre of the wave column,
 * and the only way to guarantee that is for every row to agree on where that
 * column is. The first version positioned the rope with a hand-computed
 * offset and it sat 12px off centre.
 */
export const ROW_GRID = 'grid grid-cols-[2.25rem_2.75rem_1fr] items-stretch gap-x-2';

/** The rope itself, drawn inside the wave cell so it cannot drift. */
export const ROPE = 'bg-pool-200 absolute left-1/2 w-px -translate-x-1/2';
