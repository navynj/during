'use client';

import { WaveLine } from '@/components/ui/waves';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import type { MyCategory } from '@/lib/queries/profile';

/**
 * SPEC 5.7's Lanes preview strip, at its minimum: what each category did today
 * and a "+" that opens the sheet with that category prefilled — E6's third
 * entry point.
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
    <nav aria-label="Categories" className="border-pool-200 mt-6 border-t pt-4">
      <ul className="flex gap-4 overflow-x-auto pb-2">
        {categories.map((category) => {
          const count = countsByCategory[category.id] ?? 0;
          return (
            <li key={category.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <span className="text-main-900 text-xs font-medium">{category.name}</span>
              <span
                aria-hidden
                className="bg-pool-100 flex h-9 w-9 items-center justify-center rounded-full text-base"
              >
                {category.icon}
              </span>
              <span className="flex h-3 flex-col items-center gap-0.5">
                {Array.from({ length: Math.min(count, MAX_PREVIEW_LINES) }, (_, i) => (
                  <WaveLine key={i} width={16} />
                ))}
              </span>
              <button
                type="button"
                onClick={() => openSheet({ categoryId: category.id })}
                aria-label={`Add a ${category.name} ripple`}
                className="text-main-900 text-sm opacity-35"
              >
                +
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
