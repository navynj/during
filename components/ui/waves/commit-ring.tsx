'use client';

import { WAVE_COLOR_CLASS } from './wave-math';
import { usePrefersReducedMotion } from './use-reduced-motion';

export type CommitRingProps = {
  size?: number;
  /** How many rings travel outward. Three reads as water; one reads as a pulse. */
  rings?: number;
  className?: string;
  children?: React.ReactNode;
};

const STAGGER_MS = 220;

/**
 * The ripple: concentric rings spreading from a commit, each fainter than the
 * one inside it.
 *
 * Staggered rather than simultaneous, so the rings read as one disturbance
 * travelling outward instead of a set of circles scaling together. Under
 * reduced motion the rings are simply drawn at rest, which is the same figure
 * the animation passes through — the design reads correctly static (law 3).
 */
export function CommitRing({ size = 96, rings = 3, className = '', children }: CommitRingProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const indices = Array.from({ length: rings }, (_, i) => i);

  return (
    <span
      className={`relative inline-flex items-center justify-center ${WAVE_COLOR_CLASS} ${className}`}
      style={{ width: size, height: size }}
    >
      {indices.map((index) => (
        <span
          key={index}
          aria-hidden
          className={`absolute rounded-full border border-current ${
            prefersReducedMotion ? '' : 'commit-ring'
          }`}
          style={{
            // At rest the rings sit nested; in motion each starts at the
            // middle size and travels out, so both readings share one figure.
            inset: prefersReducedMotion ? `${(index * size) / (rings * 2.4)}px` : `${size / 4}px`,
            opacity: prefersReducedMotion ? 0.28 - index * 0.08 : undefined,
            animationDelay: prefersReducedMotion ? undefined : `${index * STAGGER_MS}ms`,
          }}
        />
      ))}
      {children}
    </span>
  );
}
