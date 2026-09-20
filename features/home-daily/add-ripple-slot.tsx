/**
 * SPEC 5.5: the seat of the next record, sitting at the end of the flow.
 *
 * Dotted, because law 4 keeps "not yet" for exactly this kind of empty slot.
 * A ghost is #0507C9 at reduced opacity, not a paler token — H9a left
 * #D3D7F6 reserved and unused, and the fade rides the whole item so the ring,
 * the glyph and the label cannot drift apart.
 *
 * Inert this session — S3 wires it to the input sheet with the time prefilled.
 */
const GHOST_OPACITY = 0.35;

export function AddRippleSlot({ id }: { id?: string }) {
  return (
    <li
      id={id}
      className="text-main-900 grid grid-cols-[3.5rem_2.75rem_1fr] items-center gap-x-3 py-3"
      style={{ opacity: GHOST_OPACITY }}
    >
      <span aria-hidden />
      <span className="flex justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current">
          <span className="text-lg leading-none">+</span>
        </span>
      </span>
      <span className="text-sm">Add ripple</span>
    </li>
  );
}
