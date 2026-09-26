'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { DurationChip } from '@/components/ui/chips/duration-chip';
import { WaveRule } from '@/components/ui/waves/wave-rule';
import { annotationLabel, draftFrom } from '@/features/input-sheet/draft';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { useRippleSheet } from '@/features/ripple-sheet/sheet-host';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { rippleDurationMinutes, rippleKind } from '@/lib/ripple-kind';
import { formatPagerDate, type IsoDate } from '@/lib/time';

import { deleteSplash } from './actions';
import { formatRange, type SplashSummary } from './summary';

import type { SplashDay } from './group';

const ROW_GRID = 'grid grid-cols-[2rem_1fr] gap-x-4';
const ROPE = 'bg-pool-200 absolute left-1/2 w-px -translate-x-1/2';

/**
 * A board's own screen (SPEC 5, `_docs/mockups/splash-thread.png`): the
 * range, the title over a wave underline, the count; then the rope with
 * category badges and the fragments in time order, oldest first — a story
 * reads forward even though Home reads back — with day labels grouping them
 * and photos inline and large. The add slot at the bottom opens the ripple
 * sheet preset to this board.
 *
 * Delete lives here and DETACHES the fragments (H20d); the confirm says so.
 * "Thread" is the working name and never appears on the screen.
 */
export function SplashScreen({
  splash,
  days,
  photos,
  timeZone,
  today,
}: {
  splash: SplashSummary;
  days: SplashDay[];
  /** Signed URLs by ripple id, every photo, drawn large. */
  photos: Record<string, string[]>;
  timeZone: string;
  today: IsoDate;
}) {
  const { openSheet } = useInputSheet();
  const { openRipple } = useRippleSheet();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const count = splash.count;

  return (
    <div className="flex flex-1 flex-col pt-4">
      <header className="flex flex-col gap-1 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Back to Home"
            onClick={() => router.push('/')}
            className="text-main-900 -ml-2 flex h-8 w-8 items-center justify-center"
          >
            <ArrowLeft aria-hidden size={18} />
          </button>

          {confirming ? (
            <span className="flex items-center gap-3 text-xs">
              <span className="text-pool-500">
                Deletes this splash. Its {count} ripple{count === 1 ? '' : 's'} stay, detached.
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteSplash(splash.id);
                    if (result.ok) router.push('/');
                  })
                }
                className="text-main-900 font-medium disabled:opacity-50"
              >
                Delete
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="text-pool-500">
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              aria-label="Delete this splash"
              onClick={() => setConfirming(true)}
              className="text-pool-500 flex h-8 w-8 items-center justify-center"
            >
              <Trash2 aria-hidden size={15} />
            </button>
          )}
        </div>

        {splash.range ? (
          <p data-range className="text-main-900 text-xs font-light">
            {formatRange(splash.range)}
          </p>
        ) : null}
        <h1 className="text-ink text-xl font-medium">{splash.title}</h1>
        <span className="block w-40">
          <WaveRule anchor="left" />
        </span>
        <p data-count className="text-main-900 text-[10px]">
          {count} Ripple{count === 1 ? '' : 's'}
        </p>
      </header>

      {days.map((day) => {
        const { month, day: number, weekday } = formatPagerDate(day.date);
        return (
          <section key={day.date} data-splash-day={day.date}>
            {/* A small group label, not a section: the story is one piece. */}
            <p className="text-pool-500 pb-1 pl-12 text-[10px] font-medium">
              {month} {number} {weekday}
            </p>
            <ol>
              {day.ripples.map((ripple) => (
                <FragmentRow
                  key={ripple.id}
                  ripple={ripple}
                  photos={photos[ripple.id] ?? []}
                  timeZone={timeZone}
                  today={today}
                  onOpen={() => openRipple(ripple.id)}
                />
              ))}
            </ol>
          </section>
        );
      })}

      {/* The add slot: the seat of the next fragment of this story. */}
      <div data-add-slot className={`${ROW_GRID} items-start pt-2 pb-8`}>
        <div className="relative flex justify-center">
          <span aria-hidden className={`${ROPE} top-0 h-2`} />
          <button
            type="button"
            aria-label="Drop into this splash"
            onClick={() => openSheet({ splashId: splash.id })}
            className="text-main-900 relative mt-2 flex h-11 w-11 items-center justify-center"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-current opacity-10"
            />
            <span
              aria-hidden
              className="absolute inset-1 rounded-full border border-current opacity-30"
            />
            <span
              className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white text-base leading-none font-light"
              style={{ opacity: 0.3 }}
            >
              +
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => openSheet({ splashId: splash.id })}
          className="text-main-900 self-start pt-4 text-left text-base font-medium"
          style={{ opacity: 0.2 }}
        >
          + Drop New Ripple
        </button>
      </div>
    </div>
  );
}

function FragmentRow({
  ripple,
  photos,
  timeZone,
  today,
  onOpen,
}: {
  ripple: RippleWithCategory;
  photos: string[];
  timeZone: string;
  today: IsoDate;
  onOpen: () => void;
}) {
  const kind = rippleKind(ripple, timeZone);
  const annotation = draftFrom(ripple, timeZone).annotation;

  return (
    <li data-fragment={ripple.id} className={`${ROW_GRID} py-2`}>
      <div className="relative flex justify-center">
        <span aria-hidden className={`${ROPE} inset-y-0`} />
        <span
          aria-hidden
          className="bg-pool-100 relative flex h-8 w-8 items-center justify-center rounded-full text-base"
        >
          {ripple.category?.icon ?? ''}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-col items-start gap-2 pt-1.5 text-left"
      >
        {ripple.note ? <p className="text-ink text-sm">{ripple.note}</p> : null}

        {/* Large and inline: a story is read with its pictures, not beside
            thumbnails of them. */}
        {photos.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" data-photo className="w-full rounded-xl object-cover" />
        ))}

        {annotation?.time || kind === 'timed' ? (
          <span className="flex items-center gap-2">
            {annotation?.time ? (
              <span className="text-pool-500 text-[10px] tabular-nums">
                {annotationLabel(annotation, today)}
              </span>
            ) : null}
            {kind === 'timed' ? (
              <DurationChip minutes={rippleDurationMinutes(ripple, timeZone)} />
            ) : null}
          </span>
        ) : null}
      </button>
    </li>
  );
}
