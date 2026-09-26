'use client';

import Link from 'next/link';

import { DurationChip } from '@/components/ui/chips/duration-chip';
import { annotationLabel, draftFrom } from '@/features/input-sheet/draft';
import { useRippleSheet } from '@/features/ripple-sheet/sheet-host';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { rippleDurationMinutes, rippleKind } from '@/lib/ripple-kind';
import type { IsoDate } from '@/lib/time';

import type { HomeMode } from './flow';
import { BADGE_COLUMN, ROW_GRID } from './rope';

const TRANSITION = 'transition-[opacity,transform] duration-200 motion-reduce:transition-none';

/**
 * A ripple in the flow. Full in ripple mode: note, splash tag when a member,
 * photo thumbnails, its annotation and duration where it has them. A
 * **quiet mark** in splash mode: the bare badge on the rope (SPEC 5).
 *
 * The row is the `li` in both presentations, so a switch keeps its node.
 */
export function RippleFlowRow({
  ripple,
  mode,
  splashTitle,
  thumbnails,
  timeZone,
  today,
  onQuietTap,
}: {
  ripple: RippleWithCategory;
  mode: HomeMode;
  splashTitle: string | null;
  thumbnails: string[];
  timeZone: string;
  today: IsoDate;
  /** Tapping the quiet mark switches modes, focused here. */
  onQuietTap: () => void;
}) {
  const { openRipple } = useRippleSheet();
  const full = mode === 'ripple';
  const kind = rippleKind(ripple, timeZone);
  const annotation = draftFrom(ripple, timeZone).annotation;
  const emoji = ripple.category?.icon ?? '';

  const badge = (
    <button
      type="button"
      aria-label={full ? 'Open this ripple' : 'Show ripples'}
      onClick={full ? () => openRipple(ripple.id) : onQuietTap}
      className="bg-pool-100 relative flex h-8 w-8 items-center justify-center rounded-full text-base"
    >
      <span aria-hidden>{emoji}</span>
    </button>
  );

  if (!full) {
    // A quiet mark occupies only its own box (SPEC 5): the badge floats on
    // the rope at compact spacing and claims no row, so the splash entries
    // flow past it — the two columns share the vertical space instead of
    // stacking. Cleared, so consecutive badges keep their rhythm down the
    // rope rather than sitting side by side.
    return (
      <li
        data-flow-id={ripple.id}
        data-flow-row="ripple"
        data-presentation="quiet"
        className={`float-left clear-left my-2.5 flex ${BADGE_COLUMN} justify-center ${TRANSITION}`}
      >
        {badge}
      </li>
    );
  }

  return (
    <li
      data-flow-id={ripple.id}
      data-flow-row="ripple"
      data-presentation="full"
      className={`${ROW_GRID} py-3 ${TRANSITION}`}
    >
      <div className="flex justify-center">{badge}</div>

      <button
        type="button"
        onClick={() => openRipple(ripple.id)}
        className="flex min-w-0 flex-col items-start gap-1.5 pt-1.5 text-left"
      >
        {ripple.note ? <p className="text-ink text-sm">{ripple.note}</p> : null}

        {thumbnails.length > 0 ? (
          <ul data-thumbnails className="flex gap-1.5">
            {thumbnails.map((url) => (
              <li key={url} className="bg-pool-100 h-14 w-14 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </li>
            ))}
          </ul>
        ) : null}

        {annotation || kind === 'timed' || splashTitle ? (
          <span className="flex flex-wrap items-center gap-2">
            {annotation ? (
              <span data-annotation className="text-pool-500 text-[10px] tabular-nums">
                {annotationLabel(annotation, today)}
              </span>
            ) : null}
            {kind === 'timed' ? (
              <DurationChip minutes={rippleDurationMinutes(ripple, timeZone)} />
            ) : null}
            {splashTitle && ripple.splash_id ? (
              <Link
                href={`/splash/${ripple.splash_id}`}
                onClick={(event) => event.stopPropagation()}
                data-splash-tag
                className="border-pool-100 text-pool-500 rounded-full border px-2 py-px text-[10px]"
              >
                {splashTitle}
              </Link>
            ) : null}
          </span>
        ) : null}
      </button>
    </li>
  );
}
