'use client';

import { GhostRing } from '@/components/ui/ghost-ring';
import { WaveRule } from '@/components/ui/waves/wave-rule';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';

import type { HomeMode } from './flow';
import { ROW_GRID } from './rope';

/** A ghost is #0507C9 at reduced opacity, not a paler token (H9a). */
const GHOST_OPACITY = 0.2;

/**
 * The head of the flow (SPEC 5): the flow reads newest first, so the seat of
 * the next thing is at the top — a ghost ring on the badge column, above the
 * first ripple and so above where the rope begins, and beside it the mode's
 * own invitation: `+ Drop New Ripple` in ripple mode, or `+ Drop New Splash`
 * on a gray wave underline in splash mode.
 */
export function FlowGhost({ mode }: { mode: HomeMode }) {
  const { openSheet, openSplashSheet } = useInputSheet();

  return (
    <div data-flow-ghost className={`${ROW_GRID} items-start pt-2 pb-2`}>
      <div className="flex justify-center">
        <GhostRing label="Drop a new ripple" onClick={() => openSheet()} />
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
