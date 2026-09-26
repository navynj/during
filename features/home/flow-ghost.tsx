'use client';

import { GhostRing } from '@/components/ui/ghost-ring';
import { WaveRule } from '@/components/ui/waves/wave-rule';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';

import type { HomeMode } from './flow';
import { BADGE_COLUMN, COLUMNS_RIPPLE_MODE, COLUMNS_SPLASH_MODE, ROW_GRID } from './rope';

/** A ghost is #0507C9 at reduced opacity, not a paler token (H9a). */
const GHOST_OPACITY = 0.2;

/**
 * The head of the flow (SPEC 5): the flow reads newest first, so the seat of
 * the next thing is the first item of the newest month's columns. The ring
 * heads the ripple column — it is the first seat on the rope, which begins
 * there — with `+ Drop New Ripple` beside it in ripple mode; in splash mode
 * `+ Drop New Splash` heads the splash column on a gray wave underline.
 */
export function GhostSeat({ mode }: { mode: HomeMode }) {
  const { openSheet } = useInputSheet();

  return (
    <li
      data-flow-ghost
      className={`pt-2 pb-2 ${mode === 'ripple' ? ROW_GRID : `flex ${BADGE_COLUMN} justify-center`}`}
    >
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
      ) : null}
    </li>
  );
}

export function SplashInvite() {
  const { openSplashSheet } = useInputSheet();

  return (
    <li data-flow-invite className="flex justify-end pt-2 pb-2">
      <button type="button" onClick={openSplashSheet} className="flex flex-col items-end pt-4">
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
    </li>
  );
}

/** The head on its own, for a diary with nothing in it yet: no rope to start. */
export function FlowGhost({ mode }: { mode: HomeMode }) {
  return (
    <div
      className={`grid gap-x-4 ${mode === 'ripple' ? COLUMNS_RIPPLE_MODE : COLUMNS_SPLASH_MODE}`}
    >
      <ol data-column="ripples">
        <GhostSeat mode={mode} />
      </ol>
      <ol data-column="splashes">{mode === 'splash' ? <SplashInvite /> : null}</ol>
    </div>
  );
}
