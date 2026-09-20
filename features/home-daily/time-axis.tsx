import type { WaveMotion } from '@/components/ui/waves';
import type { RippleWithCategory } from '@/lib/queries/ripples';

import { AddRippleSlot } from './add-ripple-slot';
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
  motion,
}: {
  ripples: RippleWithCategory[];
  timeZone: string;
  now: Date;
  motion: WaveMotion;
}) {
  return (
    <section className="relative">
      {/* The rope: one continuous line the records sit on. Behind them, and
          inset to the wave column so the waves read as marks on it. */}
      <span aria-hidden className="bg-pool-200 absolute top-2 bottom-2 left-[4.875rem] w-px" />

      <ol className="relative flex flex-col">
        {ripples.map((ripple) => (
          <RippleRow
            key={ripple.id}
            ripple={ripple}
            timeZone={timeZone}
            now={now}
            motion={motion}
          />
        ))}
        <AddRippleSlot id={ADD_RIPPLE_SLOT_ID} />
      </ol>
    </section>
  );
}
