'use client';

import { bundleLineCount, DEFAULT_WAVE_MOTION, stateOpacity, WAVE_GAP } from './wave-math';
import type { WaveMotion, WaveState } from './wave-math';
import { usePrefersReducedMotion } from './use-reduced-motion';
import { WaveLine, WAVE_WIDTH } from './wave-line';

export type WaveBundleProps = {
  /** Drives the line count, and through it the bundle's height. */
  durationMinutes: number;
  state?: WaveState;
  width?: number;
  /** Constant pitch between lines; only the count varies with duration. */
  gap?: number;
  /** How an in-progress record moves. Both modes are live while we choose. */
  motion?: WaveMotion;
  /** Passed through to every line; see WaveLine. */
  strokeWidth?: number;
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
  motion = DEFAULT_WAVE_MOTION,
  strokeWidth,
  emoji,
  className = '',
}: WaveBundleProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lines = bundleLineCount(durationMinutes);

  // An in-progress timed is the only thing here that is still happening, so
  // it is the only thing allowed to move (law 3). The whole bundle travels,
  // in phase: it is one body of water, and moving a single line inside a
  // still stack reads as that line being broken rather than the record living.
  const isLiving = state === 'active' && !prefersReducedMotion;

  // The two modes differ in scope, not just in shape. `grow` is the most
  // recent line stretching at the leading edge of the record, so only the last
  // line moves and the ones above it are already settled water. `travel` is
  // the whole record still flowing, so every line moves in phase — one line
  // sliding inside a still stack would read as that line being broken.
  function lineMotion(index: number): WaveMotion | undefined {
    if (!isLiving) return undefined;
    if (motion === 'grow') return index === lines - 1 ? 'grow' : undefined;
    return motion;
  }

  return (
    // The fade sits on the wrapper, so the category badge goes with the waves:
    // a planned record is one faint thing, not faint waves under a solid icon.
    // Lines are therefore rendered without state, or they would fade twice.
    <div
      className={`flex flex-col items-center ${className}`}
      style={{ opacity: stateOpacity(state) }}
    >
      {emoji ? <BundleHead emoji={emoji} /> : null}
      <div className="flex flex-col items-center" style={{ gap, width }} data-lines={lines}>
        {Array.from({ length: lines }, (_, index) => (
          <WaveLine
            key={index}
            width={width}
            strokeWidth={strokeWidth}
            motion={lineMotion(index)}
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
