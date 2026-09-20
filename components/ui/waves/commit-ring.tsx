'use client';

import { toneClass } from './wave-math';
import type { WaveTone } from './wave-math';
import { usePrefersReducedMotion } from './use-reduced-motion';

export type CommitRingProps = {
  size?: number;
  tone?: WaveTone;
  className?: string;
};

/**
 * The commit feedback: "one expanding ring, settling to a single ring"
 * (SPEC 7 law 3, F5). One ring, once — not a pulse, not a loop. After commit
 * the sheet closes and nothing else happens (E5: no praise, no share prompt).
 *
 * Under reduced motion the settled ring is simply drawn, which is the same
 * end state the animation arrives at — the design reads correctly static.
 */
export function CommitRing({ size = 40, tone = 'live', className = '' }: CommitRingProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const radius = size / 2 - 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden
      className={`${toneClass(tone)} ${className}`}
    >
      {/* The ring that stays. */}
      <circle cx={size / 2} cy={size / 2} r={radius / 2} stroke="currentColor" strokeWidth={1.5} />
      {!prefersReducedMotion ? (
        // The one that expands and fades out. Scales from the centre, so the
        // animation is transform and opacity only.
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          className="commit-ring"
          style={{ transformOrigin: 'center' }}
        />
      ) : null}
    </svg>
  );
}
