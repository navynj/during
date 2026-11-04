'use client';

import { useState } from 'react';

import { Monogram } from '@/components/ui/monogram';
import type { AudiencePick } from '@/features/pool/audience';
import type { AudiencePool } from '@/features/pool/audience-sheet';
import { useStripPools } from '@/features/pool/activity';

/**
 * Where a record from Home goes, said while it is written (H75, revising
 * H45(b)): a toggle chip per pool I am in, every one off, so *Only you can
 * see this* reads under the row until one is turned on. A pool turned on is
 * on a lane at once — sharing never waits on a lane — and its chip names
 * it; tapping that part changes it. Selection is the ink fill (H20f).
 */
export function ShareToRow({
  pools,
  shared,
  startLane,
  onChange,
}: {
  pools: AudiencePool[];
  shared: AudiencePick[];
  /** The lane a pool starts on when turned on (fallbackLane), or none. */
  startLane: (poolId: string) => string | null;
  /** A pool on a pool lane, or off (null); `picked` when the lane was chosen by hand. */
  onChange: (poolId: string, poolLaneId: string | null, picked: boolean) => void;
}) {
  // The pool whose lanes are open under the row, to change its lane.
  const [choosing, setChoosing] = useState<string | null>(null);
  const photos = useStripPools();
  if (pools.length === 0) return null;
  const laneOf = (poolId: string): string | null =>
    shared.find((pick) => pick.poolId === poolId)?.poolLaneId ?? null;
  const open = pools.find((p) => p.id === choosing && laneOf(p.id));
  return (
    <div data-share-to className="flex flex-col gap-2">
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
                onClick={() => onChange(pool.id, start, false)}
                className="border-pool-200 text-ink inline-flex h-8 max-w-[14rem] items-center gap-1.5 rounded-full border px-3 text-sm disabled:opacity-40"
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
              className="bg-ink inline-flex h-8 max-w-[16rem] items-center rounded-full text-sm text-white"
            >
              <button
                type="button"
                aria-pressed
                aria-label={`Stop sharing to ${pool.name}`}
                onClick={() => {
                  setChoosing(null);
                  onChange(pool.id, null, false);
                }}
                className="inline-flex min-w-0 items-center gap-1.5 py-1 pl-3"
              >
                {face}
                <span className="truncate">{pool.name}</span>
              </button>
              <button
                type="button"
                data-share-lane={lane.id}
                aria-expanded={choosing === pool.id}
                aria-label={`Lane in ${pool.name}: ${lane.name}. Change it`}
                onClick={() => setChoosing(choosing === pool.id ? null : pool.id)}
                className="inline-flex min-w-0 items-center gap-1 py-1 pr-3 pl-1 opacity-80"
              >
                <span aria-hidden>·</span>
                <span className="truncate">
                  {lane.icon ? `${lane.icon} ` : ''}
                  {lane.name}
                </span>
              </button>
            </span>
          );
        })}
      </div>
      {open ? (
        // The open pool's lanes, to move it to another (H75).
        <div data-share-lanes={open.id} className="flex flex-wrap gap-1.5">
          {open.lanes.map((lane) => {
            const on = lane.id === laneOf(open.id);
            return (
              <button
                key={lane.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setChoosing(null);
                  onChange(open.id, lane.id, true);
                }}
                className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs ${
                  on ? 'bg-ink text-white' : 'border-pool-200 text-ink border'
                }`}
              >
                {lane.icon ? `${lane.icon} ` : ''}
                {lane.name}
              </button>
            );
          })}
        </div>
      ) : null}
      {shared.length === 0 ? (
        <p data-share-private className="text-pool-500 text-xs">
          Only you can see this
        </p>
      ) : null}
    </div>
  );
}
