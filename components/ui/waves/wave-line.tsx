import {
  stateOpacity,
  strokeDasharray,
  toneClass,
  waveLinePath,
  WAVE_HEIGHT,
  WAVE_STROKE,
} from './wave-math';
import type { WaveState, WaveTone } from './wave-math';

/** The export's width. Lanes cells and the timeline both use it. */
export const WAVE_WIDTH = 22;

export type WaveLineProps = {
  tone?: WaveTone;
  state?: WaveState;
  width?: number;
  className?: string;
  /** Set by WaveBundle on its last line so only that one moves. */
  growing?: boolean;
};

/**
 * A single wave line — one drop (SPEC 7: "drop = single wave line").
 *
 * Stroke only, no fill: the grammar is a line drawn on water, and a filled
 * shape reads as a block, which F3 rejected.
 */
export function WaveLine({
  tone = 'live',
  state = 'done',
  width = WAVE_WIDTH,
  className = '',
  growing = false,
}: WaveLineProps) {
  return (
    <svg
      width={width}
      height={WAVE_HEIGHT}
      viewBox={`0 0 ${width} ${WAVE_HEIGHT}`}
      fill="none"
      aria-hidden
      className={`${toneClass(tone)} ${className}`}
    >
      <path
        d={waveLinePath(width)}
        stroke="currentColor"
        strokeWidth={WAVE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray(state)}
        opacity={stateOpacity(state)}
        // Law 3: only living things move. Scales along x from the left edge,
        // so the animation touches transform only and never reflows the bundle.
        className={growing ? 'wave-grow' : undefined}
      />
    </svg>
  );
}
