'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { CategoryChip } from '@/components/ui/chips/category-chip';
import { Monogram } from '@/components/ui/monogram';
import type { AudiencePick } from '@/features/pool/audience';
import type { AudiencePool } from '@/features/pool/audience-sheet';
import { useStripPools } from '@/features/pool/activity';

import { ShareLanePicker } from './share-lane-picker';

/**
 * Where a record from Home goes, said while it is written (H75, revising
 * H45(b)): a toggle chip per pool I am in, every one off, so *Only you can
 * see this* reads under the row until one is turned on. A pool turned on is
 * on a lane at once — sharing never waits on a lane — and carries that lane
 * as the lane row's own chip with a chevron: its name and face toggle the
 * pool, the lane chip only opens that pool's lanes. Selection is the ink
 * fill (H20f).
 */
export function ShareToRow({
  pools,
  shared,
  startLane,
  onTurn,
  onPick,
}: {
  pools: AudiencePool[];
  shared: AudiencePick[];
  /** The lane a pool starts on when turned on (fallbackLane), or none. */
  startLane: (poolId: string) => string | null;
  /** A pool turned on, on its starting lane, or off (null). */
  onTurn: (poolId: string, poolLaneId: string | null) => void;
  /** A lane picked by hand in the pool's lane picker. */
  onPick: (poolId: string, poolLaneId: string) => void;
}) {
  // The pool whose lanes are open, to change its lane.
  const [choosing, setChoosing] = useState<string | null>(null);
  const photos = useStripPools();
  if (pools.length === 0) return null;
  const laneOf = (poolId: string): string | null =>
    shared.find((pick) => pick.poolId === poolId)?.poolLaneId ?? null;
  const open = pools.find((p) => p.id === choosing && laneOf(p.id));
  return (
    <div data-share-to className="relative flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-pool-500 text-xs">Share to</span>
        {pools.map((pool) => {
          const laneId = laneOf(pool.id);
          const lane = pool.lanes.find((l) => l.id === laneId);
          const start = startLane(pool.id);
          const photo = photos.find((p) => p.id === pool.id)?.photo ?? null;
          const face = <Monogram name={pool.name} size="chip" photo={photo} />;
          if (!lane) {
            return (
              <button
                key={pool.id}
                type="button"
                data-share-pool={pool.id}
                aria-pressed={false}
                disabled={!start}
                onClick={() => onTurn(pool.id, start)}
                className="bg-pool-100 hover:text-ink inline-flex max-w-[14rem] items-center gap-1 rounded-full px-2.5 py-1 text-xs text-(--text-inactive) disabled:opacity-40"
              >
                {face}
                <span className="truncate">{pool.name}</span>
              </button>
            );
          }
          return (
            <span
              key={pool.id}
              data-share-pool={pool.id}
              data-on=""
              className="bg-ink inline-flex max-w-[18rem] items-center gap-1 rounded-full pr-1 text-xs text-white"
            >
              <button
                type="button"
                aria-pressed
                aria-label={`Stop sharing to ${pool.name}`}
                onClick={() => {
                  setChoosing(null);
                  onTurn(pool.id, null);
                }}
                className="inline-flex min-w-0 items-center gap-1 py-1 pl-2.5"
              >
                {face}
                <span className="truncate">{pool.name}</span>
              </button>
              <CategoryChip
                icon={lane.icon}
                name={lane.name}
                selected
                onInk
                data-share-lane={lane.id}
                aria-haspopup="dialog"
                aria-expanded={choosing === pool.id}
                aria-label={`Category in ${pool.name}: ${lane.name}. Change it`}
                onSelect={() => setChoosing(choosing === pool.id ? null : pool.id)}
                trailing={<ChevronDown aria-hidden size={12} className="-mr-0.5 opacity-80" />}
                className="min-w-0"
              />
            </span>
          );
        })}
      </div>
      {open ? (
        <ShareLanePicker
          pool={open}
          current={laneOf(open.id)}
          onPick={(laneId) => onPick(open.id, laneId)}
          onClose={() => setChoosing(null)}
        />
      ) : null}
      {shared.length === 0 ? (
        <p data-share-private className="text-pool-500 text-xs">
          Only you can see this
        </p>
      ) : null}
    </div>
  );
}
