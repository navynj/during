import { impressionLineCount } from '@/components/ui/waves';
import { WaveRule } from '@/components/ui/waves/wave-rule';

/**
 * The splash stack draws at one and a half times the pinned geometry: the
 * export's lines are 6px tall at 6px pitch, which is the same curve enlarged
 * rather than a second shape (H9).
 */
export const SPLASH_WAVE_SCALE = 1.5;

/**
 * A board's waves: its fragment count on the log scale (law 2), right-anchored
 * and running off the edge, per `_docs/mockups/home-splash-mode.png`. A board
 * with nothing in it yet draws one line, so it has a mark at all.
 */
export function SplashWaves({ count, className = '' }: { count: number; className?: string }) {
  const lines = Math.max(1, impressionLineCount(count));
  return (
    <span data-splash-waves data-lines={lines} className={`flex flex-col ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <WaveRule key={index} anchor="right" scale={SPLASH_WAVE_SCALE} />
      ))}
    </span>
  );
}
