'use client';

import { useState } from 'react';
import { Lock, MoreHorizontal, Users } from 'lucide-react';

import { CategoryChip } from '@/components/ui/chips/category-chip';
import { usePeople } from '@/features/people/people-provider';
import type { PoolFace, PoolLaneChip } from '@/lib/queries/pools';

import { audienceLabel, NOBODY, type AudiencePick, type PickTogether } from './audience';
import { MoveToHome, type MoveHome } from './move-to-home';
import { WithLine } from './with-line';
import { Switch } from './switch';
import { PoolSheet, SheetTitle } from './sheet';

/** A pool I am in, with its lanes and members: one row in Audience. */
export type AudiencePool = {
  id: string;
  name: string;
  lanes: PoolLaneChip[];
  members?: PoolFace[];
};

/**
 * The Audience chip (H23, 0033): one compact chip beside the lane picker in
 * the composer and in a record's header, saying where it is shared — *Only
 * me*, "<Pool> · <emoji> <pool lane>", or *N pools*. A tap opens the sheet.
 * A joint record has no chip: it belongs to its pool.
 */
export function AudienceChip({
  shared,
  pools,
  preselect,
  onChange,
  onTogether,
  locked = null,
  moveHome = null,
  invite = false,
}: {
  /** Where the record is shared now: a pool lane per pool. */
  shared: AudiencePick[];
  /** Every pool I am in: a row each. */
  pools: AudiencePool[];
  /** The lane a pool starts on when turned on (fallbackLane, H75); none only for a pool with no lanes. */
  preselect: (poolId: string) => string | null;
  /** A pool on a pool lane, or off (null). */
  onChange: (poolId: string, poolLaneId: string | null) => void;
  /** With, per pool that is on (0035); absent, no With line. */
  onTogether?: (poolId: string, together: PickTogether) => void;
  /** My record written in a pool (0056): its pool, always on, its lane still picked. */
  locked?: string | null;
  /** The same record (H45): the header's `…` offers Move to Home. */
  moveHome?: MoveHome | null;
  /** A record's header (H75): shared nowhere, it reads *Only me* with a *Share* to open the sheet. */
  invite?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const on = shared.filter((pick) => pools.some((p) => p.id === pick.poolId));
  const sheet = open ? (
    <AudienceSheet
      pools={pools}
      shared={on}
      preselect={preselect}
      onChange={onChange}
      onTogether={onTogether}
      locked={locked}
      moveHome={moveHome}
      onClose={() => setOpen(false)}
    />
  ) : null;
  if (invite && on.length === 0 && !locked) {
    // Private said in words, and the way out of it beside them (H75).
    return (
      <>
        <span data-audience-private className="inline-flex shrink-0 items-center gap-2">
          <span className="bg-pool-100 text-ink inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm">
            <Lock aria-hidden size={13} className="text-pool-500 shrink-0" />
            Only me
          </span>
          <button
            type="button"
            data-audience-chip
            aria-label="Share: Only me"
            onClick={() => setOpen(true)}
            className="text-main-900 text-sm font-semibold"
          >
            Share
          </button>
        </span>
        {sheet}
      </>
    );
  }
  return (
    <>
      <button
        type="button"
        data-audience-chip
        aria-label={`Audience: ${chipLabel(on, pools)}`}
        onClick={() => setOpen(true)}
        className="border-pool-200 text-ink inline-flex h-8 max-w-[12rem] shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm"
      >
        <Users aria-hidden size={14} className="text-pool-500 shrink-0" />
        <span className="truncate">{chipLabel(on, pools)}</span>
      </button>
      {sheet}
    </>
  );
}

/** "Only me", "Our Pool · 🎲 Games", or "N pools". */
export function chipLabel(shared: AudiencePick[], pools: AudiencePool[]): string {
  if (shared.length === 1) {
    const pool = pools.find((p) => p.id === shared[0].poolId);
    const lane = pool?.lanes.find((l) => l.id === shared[0].poolLaneId);
    if (pool && lane) return `${pool.name} · ${lane.icon ? `${lane.icon} ` : ''}${lane.name}`;
  }
  return audienceLabel(
    shared.map((pick) => pools.find((p) => p.id === pick.poolId)?.name ?? 'A diary'),
  );
}

/**
 * Where a record is shared (0033): a row per pool I am in, each with a
 * switch. Turned on, it is shared at once on the lane it starts on, and the
 * row shows that pool's lane chips to change it (H75); only a pool with no
 * lanes waits for one, with nothing shared yet. Sections, so a *Followers* row can join *Pools*
 * later without reshaping this; only Pools is built.
 */
function AudienceSheet({
  pools,
  shared,
  preselect,
  onChange,
  onTogether,
  locked,
  moveHome,
  onClose,
}: {
  pools: AudiencePool[];
  shared: AudiencePick[];
  preselect: (poolId: string) => string | null;
  onChange: (poolId: string, poolLaneId: string | null) => void;
  onTogether?: (poolId: string, together: PickTogether) => void;
  locked: string | null;
  moveHome: MoveHome | null;
  onClose: () => void;
}) {
  const { me } = usePeople();
  // The header's `…` (H45): closed, open, or asking which lane.
  const [menu, setMenu] = useState<'closed' | 'open' | 'moving'>('closed');
  // Turned on with no chip to start on: shown on, shared only once picked.
  const [waiting, setWaiting] = useState<string[]>([]);
  const laneOf = (poolId: string): string | null =>
    shared.find((pick) => pick.poolId === poolId)?.poolLaneId ?? null;
  return (
    <PoolSheet label="Audience" onClose={onClose}>
      <div className="relative flex items-start justify-between gap-4">
        <SheetTitle>Audience</SheetTitle>
        {moveHome ? (
          <button
            type="button"
            aria-label="More"
            aria-expanded={menu !== 'closed'}
            data-audience-more
            onClick={() => setMenu(menu === 'closed' ? 'open' : 'closed')}
            className="text-pool-500 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          >
            <MoreHorizontal aria-hidden size={18} />
          </button>
        ) : null}
        {moveHome && menu === 'open' ? (
          // In ink, the selection channel, as the card's menu.
          <ul
            role="menu"
            data-audience-menu
            className="surface bg-ink absolute top-8 right-0 z-20 flex w-64 flex-col rounded-xl py-1 text-sm text-white shadow-lg"
          >
            <li>
              <button
                type="button"
                role="menuitem"
                data-audience-move-home
                onClick={() => setMenu('moving')}
                className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left"
              >
                <span>Move to Home</span>
                <span className="text-xs text-white/70">
                  Keeps it shared here, and lets you turn this diary off later.
                </span>
              </button>
            </li>
          </ul>
        ) : null}
      </div>
      {moveHome && menu === 'moving' ? (
        <div className="mb-5">
          <MoveToHome
            move={{
              ...moveHome,
              onMove: (laneId) => {
                setMenu('closed');
                moveHome.onMove(laneId);
              },
            }}
            onCancel={() => setMenu('closed')}
          />
        </div>
      ) : null}
      <p className="text-pool-500 -mt-2 mb-5 text-sm">
        Every note on this page follows it. With every switch off, it is yours alone.
      </p>
      <section data-audience-section="Diaries" className="mb-6">
        <h3 className="text-pool-500 mb-1 text-xs">Diaries</h3>
        <ul className="flex flex-col">
          {pools.map((pool) => {
            const lane = laneOf(pool.id);
            const on = lane !== null || waiting.includes(pool.id);
            return (
              <li
                key={pool.id}
                data-audience-row={pool.id}
                className="border-pool-100 flex flex-col gap-3 border-b py-3"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-ink truncate">Shared to {pool.name}</span>
                    {pool.id === locked ? (
                      // Written there (0056): it cannot be turned off; its lane can change.
                      <span data-audience-origin className="text-pool-500 text-xs">
                        Written here, always shared
                      </span>
                    ) : null}
                  </span>
                  <Switch
                    on={on}
                    disabled={pool.id === locked}
                    label={`Shared to ${pool.name}`}
                    onChange={(next) => {
                      if (!next) {
                        setWaiting((list) => list.filter((id) => id !== pool.id));
                        onChange(pool.id, null);
                        return;
                      }
                      const start = preselect(pool.id);
                      if (start) onChange(pool.id, start);
                      else setWaiting((list) => [...list, pool.id]);
                    }}
                  />
                </span>
                {on ? (
                  <span
                    data-audience-lanes={pool.id}
                    className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1"
                  >
                    {/* The lane row's own chips, as in Share to (H75). */}
                    {pool.lanes.map((chip) => (
                      <CategoryChip
                        key={chip.id}
                        icon={chip.icon}
                        name={chip.name}
                        selected={chip.id === lane}
                        data-audience-lane={chip.id}
                        onSelect={() => {
                          setWaiting((list) => list.filter((id) => id !== pool.id));
                          onChange(pool.id, chip.id);
                        }}
                      />
                    ))}
                  </span>
                ) : null}
                {/* With, in this pool (0035): once it sits on a pool lane. */}
                {lane && onTogether ? (
                  <WithLine
                    poolId={pool.id}
                    faces={(pool.members ?? []).filter((m) => m.id !== me)}
                    together={shared.find((p) => p.poolId === pool.id)?.together ?? NOBODY}
                    onChange={(next) => onTogether(pool.id, next)}
                  />
                ) : null}
              </li>
            );
          })}
          {pools.length === 0 ? (
            <li className="text-pool-500 py-3 text-sm">You are in no diary yet.</li>
          ) : null}
        </ul>
      </section>
      {/* Each switch and chip applies as it is touched, so this only closes:
          Done, as the edit sheet's (review, 2026-10-31). */}
      <button
        type="button"
        data-audience-done
        onClick={onClose}
        className="border-pool-200 text-ink w-full rounded-full border py-2.5 text-base font-medium"
      >
        Done
      </button>
    </PoolSheet>
  );
}
