import {
  stateOpacity,
  travellingWaveWidth,
  waveHeight,
  waveLinePath,
  waveWavelength,
  WAVE_STROKE,
} from './wave-math';
import type { WaveState } from './wave-math';

/** The export's width. Lanes cells and the timeline both use it. */
export const WAVE_WIDTH = 22;

export type WaveLineProps = {
  state?: WaveState;
  width?: number;
  className?: string;
  /** Set by WaveBundle on an in-progress record; still otherwise. */
  travelling?: boolean;
  /**
   * Size of the drawn wave. `1` is the pinned Figma geometry; the live
   * surface uses DEEP_SCALE, where the same curve is enlarged rather than
   * replaced — at full width the pinned one read flat.
   */
  scale?: number;
};

/**
 * A single wave line — one drop (SPEC 7: "drop = single wave line").
 *
 * Stroke only, no fill: the grammar is a line drawn on water, and a filled
 * shape reads as a block, which F3 rejected.
 */
export function WaveLine({
  state = 'done',
  width = WAVE_WIDTH,
  className = '',
  travelling = false,
  scale = 1,
}: WaveLineProps) {
  // A travelling line is drawn long and clipped by the viewBox, so the water
  // moves through a fixed window instead of the waveform being distorted
  // (H10).
  const pathWidth = travelling ? travellingWaveWidth(width, scale) : width;
  const height = waveHeight(scale);
  const wavelength = waveWavelength(scale);

  const path = (
    <path
      d={waveLinePath(pathWidth, scale)}
      stroke="var(--wave-ink)"
      strokeWidth={WAVE_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Law 3: only living things move. Transform only — never layout.
      className={travelling ? 'wave-travel' : undefined}
    />
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      className={className}
      // The loop shifts by exactly one wavelength, which scales with the wave.
      style={{ opacity: stateOpacity(state), ['--wave-shift' as string]: `${-wavelength}px` }}
    >
      {travelling ? (
        // Parked one wavelength left so the path overhangs both edges for the
        // whole loop; the animation then shifts it one more wavelength.
        <g transform={`translate(${-wavelength} 0)`}>{path}</g>
      ) : (
        path
      )}
    </svg>
  );
}
