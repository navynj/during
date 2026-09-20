'use client';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';

import { ROW_SURFACE } from './depth';
import { ROPE, ROW_GRID } from './row-grid';

/**
 * SPEC 5.5: the seat of the next record, sitting at the end of the flow.
 *
 * Dotted, because law 4 keeps "not yet" for exactly this kind of empty slot.
 * A ghost is #0507C9 at reduced opacity, not a paler token — H9a left
 * #D3D7F6 reserved and main-400 is chips only.
 *
 * The fade sits on the circle and the label, not on the row: the rope passing
 * through belongs to the axis, not to the slot, and should not dim with it.
 *
 * E6: the second entry point, with the time prefilled to now.
 */
const GHOST_OPACITY = 0.35;
/** The row's top padding: the rope arrives at the circle and stops there. */
const ROPE_HEIGHT = '0.5rem';

export function AddRippleSlot({ id }: { id?: string }) {
  const { openSheet } = useInputSheet();

  return (
    <li id={id} className={ROW_GRID}>
      <span aria-hidden />

      <div className="relative flex justify-center pt-2 pb-2">
        <span aria-hidden className={`${ROPE} top-0`} style={{ height: ROPE_HEIGHT }} />
        {/* Filled with the page's ground so the rope cannot show through. */}
        <button
          type="button"
          onClick={() => openSheet()}
          aria-label="Add ripple"
          className={`text-main-900 relative flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current ${ROW_SURFACE}`}
          style={{ opacity: GHOST_OPACITY }}
        >
          <span className="text-lg leading-none">+</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => openSheet()}
        className="text-main-900 self-start pt-4 text-left text-sm"
        style={{ opacity: GHOST_OPACITY }}
      >
        Add ripple
      </button>
    </li>
  );
}
