'use client';

import { CommitRing } from '@/components/ui/waves';

/**
 * The ghost ring: the seat of the next record. Its rings ripple outward —
 * the commit ripple's own figure, the invitation being the one still thing
 * that moves (SPEC 7 law 3, the stated exception); nested at rest under
 * reduced motion. #0507C9 at reduced opacity, not a paler token (H9a).
 *
 * It is the first seat on the rope, so it carries `data-badge` and the rope
 * measures its start from it; only its inner disc is white, so the rope
 * passes behind the disc and the rings stay open. A hair larger than a
 * badge, and never shrunk: the badge column is narrower than the ring, and
 * a ring squeezed to the column reads as a rounded square.
 */
export function GhostRing({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-badge
      onClick={onClick}
      className="relative mt-2 flex h-9 w-9 shrink-0 items-center justify-center"
    >
      <CommitRing size={36} contentSize={20} gap={2} rings={2} ringOpacity={0.3}>
        <span
          data-ghost-disc
          className="text-main-900 relative flex h-5 w-5 items-center justify-center rounded-full bg-white text-base leading-none font-light"
        >
          <span style={{ opacity: 0.3 }}>+</span>
        </span>
      </CommitRing>
    </button>
  );
}
