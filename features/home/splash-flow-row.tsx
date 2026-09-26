'use client';

import Link from 'next/link';

import { OutlineChip } from '@/components/ui/chips/category-chip';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { formatRange, type SplashSummary } from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';

import type { HomeMode } from './flow';
import { SplashWaves } from './splash-waves';

/**
 * A splash in the flow, on the right (SPEC 5, `home-splash-mode.png`): the
 * date range and title right-aligned, a meta row of lane chips (declared,
 * else the derived dominant — outline, never a fill) and a **+Drop** pill
 * only while the board is open, then its right-anchored waves.
 *
 * In ripple mode it is a **quiet mark**: the waves alone, floating beside the
 * rows at minimal height, with a small `+` while the board is open.
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

  return (
    <div
      data-flow-row="splash"
      data-presentation={full ? 'full' : 'quiet'}
      className={`flex flex-col items-end transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
        full ? 'gap-2 py-3' : 'py-1'
      }`}
    >
      {full ? (
        <>
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
        </>
      ) : splash.open ? (
        <button
          type="button"
          aria-label="Show splashes"
          onClick={onQuietTap}
          className="text-main-900 text-base leading-none font-medium opacity-20"
        >
          +
        </button>
      ) : null}

      {/* The waves reach the screen's edge: the page's gutter is undone here. */}
      <button
        type="button"
        aria-label={full ? `Open ${splash.title}` : 'Show splashes'}
        onClick={full ? undefined : onQuietTap}
        className="-mr-6 w-[15rem] max-w-[80%]"
        tabIndex={full ? -1 : 0}
      >
        {full ? (
          <Link href={`/splash/${splash.id}`} tabIndex={-1} className="block">
            <SplashWaves count={splash.count} />
          </Link>
        ) : (
          <SplashWaves count={splash.count} />
        )}
      </button>
    </div>
  );
}
