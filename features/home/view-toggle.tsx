'use client';

export type { HomeView } from './scope';
import type { HomeView } from './scope';

/**
 * The header's segmented toggle, Calendar | Lane | List (round 3; Calendar first): the selected
 * segment white with blue words — on the water white carries what is
 * chosen (H21c) — the other quiet.
 */
export function ViewToggle({
  view,
  onChange,
}: {
  view: HomeView;
  onChange: (view: HomeView) => void;
}) {
  return <SegmentedToggle view={view} onChange={onChange} options={HOME_VIEWS} />;
}

// Calendar | Lane | List (review): the values are the remembered keys and
// the tests' names, the labels what the hand reads.
export const HOME_VIEWS = [
  { value: 'board', label: 'Calendar' },
  { value: 'lane', label: 'Category' },
  { value: 'date', label: 'List' },
] as const;

/** The same toggle with any segments: a pool's Lane | Date | Members (H23). */
export function SegmentedToggle<V extends string>({
  view,
  onChange,
  options,
}: {
  view: V;
  onChange: (view: V) => void;
  options: readonly { value: V; label: string }[];
}) {
  return (
    <div
      role="tablist"
      aria-label="View"
      data-view-toggle
      className="tint-1 flex w-full rounded-full bg-white/15 p-0.5 text-sm font-medium"
    >
      {options.map((option) => {
        const selected = option.value === view;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            data-view-option={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 ${selected ? 'text-main-900 bg-white' : 'text-white/70'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
