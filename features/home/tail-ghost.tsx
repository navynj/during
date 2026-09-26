'use client';

import { WaveRule } from '@/components/ui/waves/wave-rule';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';

import type { HomeMode } from './flow';
import { ROW_GRID } from './rope';

/** A ghost is #0507C9 at reduced opacity, not a paler token (H9a). */
const GHOST_OPACITY = 0.2;
/**
 * The rope's last stub, reaching back through the tail's own top padding so
 * the line meets the month above it without a gap, then ending in the ring.
 */
const ROPE_STUB = 'bg-pool-200 absolute -top-2 left-1/2 h-4 w-px -translate-x-1/2';

/**
 * The tail of the flow (SPEC 5): the rope ends in a ghost ring, and beside it
 * the mode's own invitation — `+ Drop New Ripple` in ripple mode, or
 * `+ Drop New Splash` on a gray wave underline in splash mode.
 *
 * Still, because a ghost is not a living thing (law 3): the ring is drawn
 * nested at rest, the figure the commit ripple passes through.
 */
export function TailGhost({ mode }: { mode: HomeMode }) {
  const { openSheet, openSplashSheet } = useInputSheet();

  return (
    <div data-tail-ghost className={`${ROW_GRID} items-start pt-2 pb-6`}>
      <div className="relative flex justify-center">
        <span aria-hidden className={ROPE_STUB} />
        <button
          type="button"
          aria-label="Drop a new ripple"
          onClick={() => openSheet()}
          className="text-main-900 relative mt-2 flex h-11 w-11 items-center justify-center"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-current opacity-10"
          />
          <span
            aria-hidden
            className="absolute inset-1 rounded-full border border-current opacity-30"
          />
          <span
            className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white text-base leading-none font-light"
            style={{ opacity: 0.3 }}
          >
            +
          </span>
        </button>
      </div>

      {mode === 'ripple' ? (
        <button
          type="button"
          onClick={() => openSheet()}
          className="text-main-900 self-start pt-4 text-left text-base font-medium"
          style={{ opacity: GHOST_OPACITY }}
        >
          + Drop New Ripple
        </button>
      ) : (
        <button
          type="button"
          onClick={openSplashSheet}
          className="flex flex-col items-end self-start pt-4"
        >
          <span className="text-main-900 text-base font-medium" style={{ opacity: GHOST_OPACITY }}>
            + Drop New Splash
          </span>
          <span
            aria-hidden
            className="mt-1 -mr-6 block w-[15rem] max-w-[80%]"
            style={{ ['--wave-ink' as string]: 'var(--color-pool-200)' }}
          >
            <WaveRule anchor="right" scale={1.25} />
          </span>
        </button>
      )}
    </div>
  );
}
