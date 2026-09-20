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
 * Inert this session — S3 wires it to the input sheet with the time prefilled.
 */
const GHOST_OPACITY = 0.35;
/** The row's top padding: the rope arrives at the circle and stops there. */
const ROPE_HEIGHT = '0.5rem';

export function AddRippleSlot({ id, surface }: { id?: string; surface: string }) {
  return (
    <li id={id} className={ROW_GRID}>
      <span aria-hidden />

      <div className="relative flex justify-center pt-2 pb-2">
        <span aria-hidden className={`${ROPE} top-0`} style={{ height: ROPE_HEIGHT }} />
        {/* Filled with the page's surface so the rope cannot show through the
            circle. The colour is the page's, not white: on a past day the
            surface has already sunk and white would leave a bright disc. */}
        <span
          className={`text-main-900 relative flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current ${surface}`}
          style={{ opacity: GHOST_OPACITY }}
        >
          <span className="text-lg leading-none">+</span>
        </span>
      </div>

      <span className="text-main-900 pt-4 text-sm" style={{ opacity: GHOST_OPACITY }}>
        Add ripple
      </span>
    </li>
  );
}
