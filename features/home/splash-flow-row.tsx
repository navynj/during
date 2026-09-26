'use client';

import Link from 'next/link';

import { OutlineChip } from '@/components/ui/chips/category-chip';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { formatRange, type SplashSummary } from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';

import type { HomeMode } from './flow';
import { SplashWaves } from './splash-waves';

const TRANSITION = 'transition-[opacity,transform] duration-200 motion-reduce:transition-none';

/**
 * A quiet splash mark's cluster: compact, short, and the same on every board
 * (SPEC 5). Wider than its visible waves by the gutter it runs off into.
 */
export const QUIET_CLUSTER = 'w-24 -mr-6';

/**
 * A splash in the flow, on the right (SPEC 5, `home-splash-mode.png`): the
 * date range and title right-aligned, a meta row of lane chips (declared,
 * else the derived dominant — outline, never a fill) and a **+Drop** pill
 * only while the board is open, then its right-anchored waves.
 *
 * In ripple mode it is a **quiet mark**: the waves alone, floating beside the
 * rows — nothing else, not even a `+`; a board is thrown at from its row or
 * its screen.
 *
 * The row is the `li` in both presentations, so a switch keeps its node.
 *
 * Reserved, P2/P3: a pool-shared board renders pool identity and its
 * pool-side lane as one compound pill left of +Drop. Nothing here draws it.
 */
export function SplashFlowRow({
  splash,
  mode,
  categories,
  onQuietTap,
}: {
  splash: SplashSummary;
  mode: HomeMode;
  categories: MyCategory[];
  onQuietTap: () => void;
}) {
  const { openSheet } = useInputSheet();
  const full = mode === 'splash';
  const lanes = (splash.laneIds.length > 0 ? splash.laneIds : [splash.dominantCategoryId])
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is MyCategory => Boolean(c));

  if (!full) {
    // A quiet mark occupies only its own box (SPEC 5): a compact cluster
    // floated at the right edge at its flow position, no wider than its
    // waves, no taller than its lines, that the ripple rows flow past.
    return (
      <li
        data-flow-id={splash.id}
        data-flow-row="splash"
        data-presentation="quiet"
        className={`float-right clear-right my-1 flex flex-col items-end ${QUIET_CLUSTER} ${TRANSITION}`}
      >
        <button type="button" aria-label="Show splashes" onClick={onQuietTap} className="w-full">
          <SplashWaves count={splash.count} />
        </button>
      </li>
    );
  }

  return (
    <li
      data-flow-id={splash.id}
      data-flow-row="splash"
      data-presentation="full"
      className={`flex justify-end py-3 ${TRANSITION}`}
    >
      {/* Shrink-wrapped: the entry is exactly as wide as its widest line —
          range, title or meta row — and that width is what its waves take. */}
      <div data-splash-entry className="flex min-w-0 flex-col items-end gap-2">
        <Link href={`/splash/${splash.id}`} className="flex flex-col items-end text-right">
          <span className="text-ink text-xs font-light">{formatRange(splash.range)}</span>
          <span className="text-ink text-base font-medium">{splash.title}</span>
        </Link>

        <span className="flex items-center gap-2">
          {lanes.map((lane) => (
            <OutlineChip key={lane.id} icon={lane.icon} name={lane.name} />
          ))}
          {/* The first consumer of the open derivation (H20e): a settled
              board still takes drops from its own screen, not from here. */}
          {splash.open ? (
            <button
              type="button"
              data-drop-pill
              onClick={() => openSheet({ splashId: splash.id })}
              className="bg-main-900 h-5 rounded-full px-3 text-[10px] font-medium text-white"
            >
              + Drop
            </button>
          ) : null}
        </span>

        {/* Sized by the entry, never sizing it: its own inline size is
            contained so the long rule inside cannot widen the column, then
            it stretches to the entry's width — and out through the gutter
            to the screen's edge, per the mockup. Length is what varies; the
            geometry inside is pinned (H9). */}
        <Link
          href={`/splash/${splash.id}`}
          tabIndex={-1}
          aria-label={`Open ${splash.title}`}
          data-splash-rule
          className="-mr-6 block self-stretch contain-inline-size"
        >
          <SplashWaves count={splash.count} />
        </Link>
      </div>
    </li>
  );
}
