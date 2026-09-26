/**
 * The ghost ring: the seat of the next record, drawn as nested rings at rest.
 * Still, because a ghost is not a living thing (SPEC 7 law 3) — it is the
 * figure the commit ripple passes through, not a ripple. #0507C9 at reduced
 * opacity, not a paler token (H9a).
 */
export function GhostRing({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="text-main-900 relative mt-2 flex h-11 w-11 items-center justify-center"
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
        className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white text-base leading-none font-light"
        style={{ opacity: 0.3 }}
      >
        +
      </span>
    </button>
  );
}
