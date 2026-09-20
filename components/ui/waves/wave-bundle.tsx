'use client';

import { bundleLineCount, stateOpacity, WAVE_GAP, WAVE_HEIGHT } from './wave-math';
import type { WaveState } from './wave-math';
import { usePrefersReducedMotion } from './use-reduced-motion';
import { WaveLine, WAVE_WIDTH } from './wave-line';

/**
 * The trail on a live record: two more lines below the bundle, each fainter
 * than the last, as the ripple spreading past what has already happened.
 *
 * Wave lines rather than rings — the ring figure belongs to the commit, and
 * reusing it here would say "something just landed" about a record that has
 * been running for an hour. These are the same water, carrying on.
 */
const TRAIL_OPACITY = [0.4, 0.16];

export type WaveBundleProps = {
  /** Drives the line count, and through it the bundle's height. */
  durationMinutes: number;
  state?: WaveState;
  width?: number;
  /** Constant pitch between lines; only the count varies with duration. */
  gap?: number;
  /**
   * Stretches of the span spent on something else, as fractions of it. Those
   * lines are left out: undulation is activity, so rest is the same channel
   * at its low value (F2, H15a2). The bundle keeps its height, so the outline
   * is unbroken and only the water is calm.
   */
  calm?: { from: number; to: number }[];
  /** Category emoji — the single allowed off-palette element (H4). */
  emoji?: string;
  /**
   * `compact` is the input sheet's rail (H12): the same bundle at a tighter
   * pitch with a smaller badge, so the rail is a preset on this component
   * rather than a second rendering of the axis.
   */
  density?: 'default' | 'compact';
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
  gap,
  density = 'default',
  calm,
  emoji,
  className = '',
}: WaveBundleProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lines = bundleLineCount(durationMinutes);
  const compact = density === 'compact';
  const pitch = gap ?? (compact ? 1 : WAVE_GAP);

  // An in-progress timed is the only thing here that is still happening, so
  // it is the only thing allowed to move (law 3). The whole bundle travels,
  // in phase: it is one body of water, and moving a single line inside a
  // still stack reads as that line being broken rather than the record living.
  const isTravelling = state === 'active' && !prefersReducedMotion;

  return (
    // The fade sits on the wrapper, so the category badge goes with the waves:
    // a planned record is one faint thing, not faint waves under a solid icon.
    // Lines are therefore rendered without state, or they would fade twice.
    <div
      className={`flex flex-col items-center ${className}`}
      style={{ opacity: stateOpacity(state) }}
    >
      {emoji ? <BundleHead emoji={emoji} compact={compact} /> : null}
      <div className="flex flex-col items-center" style={{ gap: pitch, width }} data-lines={lines}>
        {Array.from({ length: lines }, (_, index) => {
          // A line stands for its own slice of the span, so a calm stretch
          // simply leaves those slices undrawn.
          if (isCalmAt(calm, (index + 0.5) / lines)) {
            return <span key={index} data-calm style={{ height: WAVE_HEIGHT }} />;
          }
          return <WaveLine key={index} width={width} travelling={isTravelling} />;
        })}

        {/* The trail belongs to the record's state, not to its motion, so it
            is drawn under reduced motion too: it is how a still page says
            this one is still running. */}
        {state === 'active'
          ? TRAIL_OPACITY.map((opacity, index) => (
              <span key={`trail-${index}`} style={{ opacity }} data-trail={index + 1}>
                <WaveLine width={width} travelling={isTravelling} />
              </span>
            ))
          : null}
      </div>
    </div>
  );
}

function BundleHead({ emoji, compact }: { emoji: string; compact: boolean }) {
  return (
    <span
      aria-hidden
      className={`bg-pool-100 mb-1 flex items-center justify-center rounded-full ${
        compact ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-sm'
      }`}
    >
      {emoji}
    </span>
  );
}

function isCalmAt(calm: { from: number; to: number }[] | undefined, at: number): boolean {
  if (!calm) return false;
  return calm.some((span) => at >= span.from && at < span.to);
}
