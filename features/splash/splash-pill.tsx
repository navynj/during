import Link from 'next/link';

import { WaveMark } from '@/components/ui/waves';
import type { MyCategory } from '@/lib/queries/profile';

import { formatPillDate, representativeLane, type DateRange, type SplashSummary } from './summary';

/** Where a pill sits: on the blue ground, or on a white page. */
export type PillGround = 'water' | 'page';

/**
 * A post as a pill (`_docs/mockups/home-ground.png`): the date small, the
 * representative lane's emoji with the title, the wave mark at the right end
 * scaled by block count. White on the ground, where it carries content in
 * the inverted channel (H21c) and sets its waves back to blue inside itself;
 * a quiet surface on a white page, the same anatomy.
 *
 * An untitled post shows its first block's first words as a ghost title.
 */
export function SplashPill({
  splash,
  range,
  categories,
  href,
  ground,
  ring = false,
}: {
  splash: SplashSummary;
  /** The date to show: the post's place on this shelf, or its range. */
  range: DateRange;
  categories: MyCategory[];
  href: string;
  ground: PillGround;
  /** True while the commit ripple plays here: the new post's pill (SPEC 6). */
  ring?: boolean;
}) {
  const lane = categories.find((c) => c.id === representativeLane(splash)) ?? null;
  const title = splash.title.trim();
  const surface = ground === 'water' ? 'bg-white text-ink' : 'bg-pool-100 text-ink';

  return (
    <Link
      href={href}
      data-splash-pill={splash.id}
      data-ring={ring ? '' : undefined}
      className={`relative flex min-w-0 items-center gap-2 rounded-full py-1.5 pr-2 pl-3.5 ${surface}`}
      style={{ ['--wave-ink' as string]: 'var(--color-main-900)' }}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-pool-500 text-[9px]/none font-medium tabular-nums">
          {formatPillDate(range)}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-[13px]/tight font-medium">
          {lane?.icon ? <span aria-hidden>{lane.icon}</span> : null}
          {title ? (
            <span className="truncate">{title}</span>
          ) : (
            <span data-ghost-title className="truncate opacity-40">
              {splash.ghostTitle ?? 'Untitled'}
            </span>
          )}
        </span>
      </span>
      <span className="text-main-900">
        <WaveMark count={splash.count} />
      </span>
    </Link>
  );
}
