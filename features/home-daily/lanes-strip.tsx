'use client';

import { Plus } from 'lucide-react';

import { WaveLine } from '@/components/ui/waves';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import type { MyCategory } from '@/lib/queries/profile';

/**
 * SPEC 5.7's Lanes preview strip, at its minimum: what each category did today
 * and a "+" that opens the sheet with that category prefilled — E6's third
 * entry point.
 *
 * A sunk panel with lane ropes between the columns, per the mockup. The badges
 * are white rather than pool-100 here: the panel is already pool-100, and a
 * badge in the same tone would dissolve into it.
 *
 * Counts are impressions, not totals (law 2), so the strip draws up to three
 * lines and stops.
 */
const MAX_PREVIEW_LINES = 3;

export function LanesStrip({
  categories,
  countsByCategory,
}: {
  categories: MyCategory[];
  countsByCategory: Record<string, number>;
}) {
  const { openSheet } = useInputSheet();

  return (
    // Pinned to the bottom of the page, directly on the tab bar: the strip is
    // a resident of the screen (SPEC 5.7), not the tail of the timeline, so it
    // stays put while the day scrolls under it.
    <nav
      aria-label="Categories"
      className="bg-pool-100 border-pool-200 sticky z-10 -mx-6 mt-8 border-t px-2 py-4"
      style={{ bottom: 'calc(var(--tab-bar-h) + env(safe-area-inset-bottom, 0px))' }}
    >
      <ul className="no-scrollbar divide-pool-200 flex divide-x overflow-x-auto">
        {categories.map((category) => {
          const count = countsByCategory[category.id] ?? 0;

          return (
            <li key={category.id} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-2">
              <span className="text-main-900 text-xs font-medium">{category.name}</span>

              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg"
              >
                {category.icon}
              </span>

              {/* Fixed height, so a quiet lane and a busy one keep the row
                  aligned rather than the strip growing with the count. */}
              <span className="flex h-3.5 flex-col items-center justify-center gap-0.5">
                {Array.from({ length: Math.min(count, MAX_PREVIEW_LINES) }, (_, i) => (
                  <WaveLine key={i} />
                ))}
              </span>

              <button
                type="button"
                onClick={() => openSheet({ categoryId: category.id })}
                aria-label={`Add a ${category.name} ripple`}
                className="text-main-900 px-3 text-sm opacity-30 hover:opacity-60"
              >
                <Plus aria-hidden size={14} />
              </button>
            </li>
          );
        })}

        <NewLaneSlot />
      </ul>
    </nav>
  );
}

/**
 * The seat of a category that does not exist yet, per the mockup. Inert: the
 * category editor lives in the Lanes tab, which is v1b — the slot is drawn so
 * the strip is whole, and says so rather than failing silently on a tap.
 */
function NewLaneSlot() {
  return (
    <li className="flex w-[4.5rem] shrink-0 flex-col items-center gap-2">
      <span className="text-xs">&nbsp;</span>
      <button
        type="button"
        disabled
        title="New lanes arrive with the Lanes tab"
        aria-label="New lane — not yet available"
        className="text-main-900 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 opacity-30"
      >
        <Plus aria-hidden size={16} />
      </button>
    </li>
  );
}
