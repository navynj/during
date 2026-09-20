'use client';

import { bundleLineCount, WAVE_GAP } from './wave-math';
import type { WaveState } from './wave-math';
import { usePrefersReducedMotion } from './use-reduced-motion';
import { WaveLine, WAVE_WIDTH } from './wave-line';

export type WaveBundleProps = {
  /** Drives the line count, and through it the bundle's height. */
  durationMinutes: number;
  state?: WaveState;
  width?: number;
  /** Constant pitch between lines; only the count varies with duration. */
  gap?: number;
  /** Category emoji — the single allowed off-palette element (H4). */
  emoji?: string;
  className?: string;
};

/**
 * A timed Ripple: a bundle of wave lines with the category badge at its head
 * (SPEC 7, "category badge at the bundle head").
 *
 * The gap is constant, so a longer record is denser-looking only because it
 * has more lines — the bundle grows downward at a fixed rate rather than
 * stretching a fixed number of lines over a variable span.
 */
export function WaveBundle({
  durationMinutes,
  state = 'done',
  width = WAVE_WIDTH,
  gap = WAVE_GAP,
  emoji,
  className = '',
}: WaveBundleProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lines = bundleLineCount(durationMinutes);

  // An in-progress timed is the only thing here that is still happening, so
  // it is the only thing allowed to move (law 3).
  const isLiving = state === 'active' && !prefersReducedMotion;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {emoji ? <BundleHead emoji={emoji} /> : null}
      <div className="flex flex-col items-center" style={{ gap, width }} data-lines={lines}>
        {Array.from({ length: lines }, (_, index) => (
          <WaveLine
            key={index}
            state={state}
            width={width}
            growing={isLiving && index === lines - 1}
          />
        ))}
      </div>
    </div>
  );
}

function BundleHead({ emoji }: { emoji: string }) {
  return (
    <span
      aria-hidden
      className="bg-pool-100 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm"
    >
      {emoji}
    </span>
  );
}
