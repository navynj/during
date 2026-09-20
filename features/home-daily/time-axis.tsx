import type { RippleWithCategory } from '@/lib/queries/ripples';
import { elapsedMinutes, rippleState, startInstant } from '@/lib/ripple-kind';

import { AddRippleSlot } from './add-ripple-slot';
import { NowBand } from './now-band';
import { RippleRow } from './ripple-row';

export const ADD_RIPPLE_SLOT_ID = 'add-ripple-slot';

/**
 * SPEC 5.4: top to bottom = early to late, Ripples at their time position,
 * with the Add ripple slot at the end of the flow.
 *
 * Chronological flow rather than a proportionally scaled axis. SPEC's "vertical
 * span = duration" was written when a bundle stretched to fill its span; H9
 * fixed the gap between lines so only the count varies, which means duration
 * now reads from the bundle's density, not from its distance to the next
 * record. Rendering both would say it twice, and disagree.
 */
export function TimeAxis({
  ripples,
  timeZone,
  now,
  calmByRipple,
  openBreakByRipple,
}: {
  ripples: RippleWithCategory[];
  timeZone: string;
  now: Date;
  /** Stretches spent on something else, per session (H15a2). */
  calmByRipple?: Record<string, { from: number; to: number }[]>;
  /** A break still running inside a session, per session. */
  openBreakByRipple?: Record<string, string>;
}) {
  return (
    // The rope is drawn per row, inside the wave cell, so it is centred by the
    // same grid that places the waves and cannot drift out of alignment.
    <section>
      {/* Clear of the divider: the first record should not look welded to it. */}
      <ol className="flex flex-col pt-5">
        {ripples.map((ripple) => {
          // A running record has its own face (H15b); everything else is a row.
          if (rippleState(ripple) === 'active') {
            return (
              <NowBand
                key={ripple.id}
                ripple={ripple}
                clock={ripple.occurred_time!.slice(0, 5)}
                elapsedMinutes={elapsedMinutes(ripple, timeZone, now)}
                startedAt={startInstant(ripple, timeZone)!.toISOString()}
                calm={calmByRipple?.[ripple.id]}
                openBreakId={openBreakByRipple?.[ripple.id] ?? null}
              />
            );
          }
          return (
            <RippleRow
              key={ripple.id}
              ripple={ripple}
              timeZone={timeZone}
              now={now}
              calm={calmByRipple?.[ripple.id]}
            />
          );
        })}
        <AddRippleSlot id={ADD_RIPPLE_SLOT_ID} />
      </ol>
    </section>
  );
}
