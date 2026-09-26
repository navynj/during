'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { DurationChip } from '@/components/ui/chips/duration-chip';
import { GhostRing } from '@/components/ui/ghost-ring';
import { WaveRule } from '@/components/ui/waves/wave-rule';
import { Rope, ROW_GRID } from '@/features/home/rope';
import { useRopeStart } from '@/features/home/use-rope-start';
import { annotationLabel, draftFrom } from '@/features/input-sheet/draft';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { useRippleSheet } from '@/features/ripple-sheet/sheet-host';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { rippleDurationMinutes, rippleKind } from '@/lib/ripple-kind';
import { formatPagerDate, type IsoDate } from '@/lib/time';

import { deleteSplash } from './actions';
import { groupStory, type StoryOrder } from './group';
import { formatRange, type SplashSummary } from './summary';

/**
 * A board's own screen (SPEC 5, `_docs/mockups/splash-thread.png`): the
 * range, the title over a wave underline, the count with a Newest / Oldest
 * control; the add slot at the top, where the newest lands; then the rope
 * with category badges and the fragments, newest first by default, with day
 * labels grouping them and photos inline and large.
 *
 * Delete lives here and DETACHES the fragments (H20d); the confirm says so.
 * "Thread" is the working name and never appears on the screen.
 */
export function SplashScreen({
  splash,
  members,
  photos,
  timeZone,
  today,
}: {
  splash: SplashSummary;
  members: RippleWithCategory[];
  /** Signed URLs by ripple id, every photo, drawn large. */
  photos: Record<string, string[]>;
  timeZone: string;
  today: IsoDate;
}) {
  const { openSheet } = useInputSheet();
  const { openRipple } = useRippleSheet();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [order, setOrder] = useState<StoryOrder>('newest');
  const [pending, startTransition] = useTransition();
  const story = useRef<HTMLDivElement>(null);
  useRopeStart(story, order);
  const count = splash.count;
  const days = groupStory(members, timeZone, order);

  return (
    <div className="flex flex-1 flex-col pt-4">
      <header className="flex flex-col gap-1 pb-2">
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
        <div className="flex items-center justify-between">
          <p data-count className="text-main-900 text-[10px]">
            {count} Ripple{count === 1 ? '' : 's'}
          </p>
          <OrderToggle order={order} onChange={setOrder} />
        </div>
      </header>

      {/* One rope behind the whole story, from the add slot's ring down. */}
      <div ref={story} className="relative pb-8">
        <Rope from="first-badge" />

        {/* The add slot at the head: the seat of the next fragment, where the
            newest lands, and the first seat on the rope. */}
        <div data-add-slot className={`${ROW_GRID} items-start pt-2 pb-2`}>
          <div className="flex justify-center">
            <GhostRing
              label="Drop into this splash"
              onClick={() => openSheet({ splashId: splash.id })}
            />
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
      </div>
    </div>
  );
}

/** Newest / Oldest. The active segment is an ink fill: selection (H20f). */
function OrderToggle({
  order,
  onChange,
}: {
  order: StoryOrder;
  onChange: (next: StoryOrder) => void;
}) {
  return (
    <div role="group" aria-label="Order" className="bg-pool-100 inline-flex rounded-full p-0.5">
      {(['newest', 'oldest'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={order === option}
          onClick={() => onChange(option)}
          className={`h-5 rounded-full px-2 text-[10px] font-medium capitalize transition-colors ${
            order === option ? 'bg-ink text-white' : 'text-pool-500'
          }`}
        >
          {option}
        </button>
      ))}
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
      <div className="flex justify-center">
        <span
          aria-hidden
          data-badge
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
