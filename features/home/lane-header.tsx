'use client';

import { Pencil, Plus } from 'lucide-react';

import { WaveStack } from '@/components/ui/waves';
import type { MyCategory } from '@/lib/queries/profile';

/** One lane's column, in the header and in the ropes beneath it. */
export const LANE_COLUMN = '4.5rem';

/**
 * The lane header row (`_docs/mockups/home-ground.png`): each lane as its
 * emoji, its name, and small white waves — its post count this month on the
 * log scale, nothing when nothing. Tap = filter the grid to that lane; tap
 * again clears. The selected lane carries the ink selection treatment: on
 * the ground, white is content and ink stays selection (H21c). The last slot
 * is the seat of a lane that does not exist yet — this row is the lanes view
 * now that the Lanes tab has retired (review); beside it, the pencil opens the
 * lanes sheet, where every lane's icon and name are edited.
 */
export function LaneHeader({
  categories,
  counts,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
}: {
  categories: MyCategory[];
  counts: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onEdit: () => void;
}) {
  return (
    <ul
      role="group"
      aria-label="Lanes"
      data-lane-header
      className="grid pt-6"
      style={{ gridTemplateColumns: `repeat(${categories.length + 2}, ${LANE_COLUMN})` }}
    >
      {categories.map((lane) => {
        const selected = lane.id === selectedId;
        return (
          <li key={lane.id} className="flex flex-col items-center">
            <button
              type="button"
              aria-pressed={selected}
              data-lane-filter={lane.id}
              onClick={() => onSelect(selected ? null : lane.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <span aria-hidden className="text-2xl/none">
                {lane.icon}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  selected ? 'bg-ink text-white' : 'text-white'
                }`}
              >
                {lane.name}
              </span>
              <WaveStack count={counts[lane.id] ?? 0} />
            </button>
          </li>
        );
      })}
      <li className="flex flex-col items-center pt-1">
        <button
          type="button"
          aria-label="New lane"
          data-new-lane
          onClick={onCreate}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-white text-white opacity-40"
        >
          <Plus aria-hidden size={14} />
        </button>
      </li>
      <li className="flex flex-col items-center pt-1">
        <button
          type="button"
          aria-label="Edit lanes"
          data-edit-lanes
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-white text-white opacity-40"
        >
          <Pencil aria-hidden size={12} />
        </button>
      </li>
    </ul>
  );
}

/**
 * The ropes: faint lines hanging from the headers through the empty water
 * above the grid, per the mockup. They fill whatever the grid leaves, so a
 * full month shows none and a fresh one shows them all the way down.
 */
export function LaneRopes({ lanes }: { lanes: number }) {
  return (
    <div
      aria-hidden
      data-lane-ropes
      className="grid min-h-8 flex-1"
      style={{ gridTemplateColumns: `repeat(${lanes + 2}, ${LANE_COLUMN})` }}
    >
      {Array.from({ length: lanes + 2 }, (_, index) => (
        <span key={index} className="flex justify-center">
          <span className="block h-full w-px bg-white/15" />
        </span>
      ))}
    </div>
  );
}
