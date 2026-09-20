import { DEFAULT_WAVE_MOTION, type WaveMotion } from '@/components/ui/waves';

/**
 * H9 leaves the motion of an in-progress timed open, to be decided on a real
 * timeline rather than a fixture page. `?motion=travel` switches every live
 * bundle on the page so the two can be compared where they will live.
 *
 * Development only: in production the parameter is ignored entirely, so the
 * shipped app has one answer and a stray link cannot change it.
 */
export function motionFromSearchParams(value: string | string[] | undefined): WaveMotion {
  if (process.env.NODE_ENV === 'production') return DEFAULT_WAVE_MOTION;
  return value === 'travel' ? 'travel' : DEFAULT_WAVE_MOTION;
}
