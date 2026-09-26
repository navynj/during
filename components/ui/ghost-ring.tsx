/**
 * The ghost ring: the seat of the next record, drawn as nested rings at rest.
 * Still, because a ghost is not a living thing (SPEC 7 law 3) — it is the
 * figure the commit ripple passes through, not a ripple. #0507C9 at reduced
 * opacity, not a paler token (H9a).
 *
 * It is the first seat on the rope, so it carries `data-badge` and the rope
 * measures its start from it; white-backed, so the rope passes behind it
 * and not through it. A hair larger than a badge, and never shrunk: the
 * badge column is narrower than the ring, and a ring squeezed to the column
 * reads as a rounded square.
 */
export function GhostRing({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-badge
      onClick={onClick}
      className="text-main-900 relative mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border border-current opacity-10"
      />
      <span
        aria-hidden
        className="absolute inset-1 rounded-full border border-current opacity-30"
      />
      <span
        className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white text-base leading-none font-light"
        style={{ opacity: 0.3 }}
      >
        +
      </span>
    </button>
  );
}
