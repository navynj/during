'use client';

import { bundleLineCount } from './wave-math';
import type { WaveState, WaveTone } from './wave-math';
import { usePrefersReducedMotion } from './use-reduced-motion';
import { WaveLine, WAVE_WIDTH } from './wave-line';

export type WaveBundleProps = {
  /** Drives the line count. The caller owns the span; see `height`. */
  durationMinutes: number;
  /**
   * Rendered height in px. SPEC 7: a bundle's vertical span IS its duration,
   * so the timeline passes the pixel span it has already computed from the
   * time axis. This component does not know the axis scale and must not guess.
   */
  height: number;
  tone?: WaveTone;
  state?: WaveState;
  width?: number;
  /** Category emoji — the single allowed off-palette element (H4). */
  emoji?: string;
  className?: string;
};

/**
 * A timed Ripple: a bundle of wave lines filling its duration span, with the
 * category badge at its head (SPEC 7, "category badge at the bundle head").
 */
export function WaveBundle({
  durationMinutes,
  height,
  tone = 'live',
  state = 'done',
  width = WAVE_WIDTH,
  emoji,
  className = '',
}: WaveBundleProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lines = bundleLineCount(durationMinutes);

  // An in-progress timed is the only thing here that is still happening, so
  // it is the only thing allowed to move (law 3).
  const isLiving = state === 'active' && !prefersReducedMotion;

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ width }}>
      {emoji ? <BundleHead emoji={emoji} /> : null}
      <div
        className="flex flex-col items-center justify-between"
        style={{ height, width }}
        data-lines={lines}
      >
        {Array.from({ length: lines }, (_, index) => (
          <WaveLine
            key={index}
            tone={tone}
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
