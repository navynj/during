'use client';

import { DurationChip } from '@/components/ui/chips/duration-chip';
import { annotationLabel, draftFrom } from '@/features/input-sheet/draft';
import { dayOf } from '@/lib/flow-key';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { rippleDurationMinutes, rippleKind } from '@/lib/ripple-kind';
import type { IsoDate } from '@/lib/time';

/** `Aug 17`, from an ISO date. */
export function shortDay(date: IsoDate): string {
  const at = new Date(`${date}T00:00:00Z`);
  return at.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * A block, read (SPEC 5, H21): a small muted date label — where it rests,
 * with its clock when it has one — then the body at reading size, then its
 * photos at full content width. No avatar, no card; tapping it edits it.
 */
export function BlockView({
  block,
  photos,
  timeZone,
  today,
  onEdit,
}: {
  block: RippleWithCategory;
  photos: (string | null)[];
  timeZone: string;
  today: IsoDate;
  onEdit: () => void;
}) {
  const kind = rippleKind(block, timeZone);
  const annotation = draftFrom(block, timeZone).annotation;
  const label = annotation
    ? annotation.time || annotation.endDate
      ? `${shortDay(annotation.date)} · ${annotationLabel(annotation, today)}`
      : shortDay(annotation.date)
    : shortDay(dayOf(block, timeZone));

  return (
    <button
      type="button"
      data-block={block.id}
      onClick={onEdit}
      aria-label="Edit this block"
      className="flex w-full flex-col items-start gap-2 text-left"
    >
      <span className="text-pool-500 flex items-center gap-2 text-[11px] tabular-nums">
        <span data-block-date>{label}</span>
        {block.category?.icon ? <span aria-hidden>{block.category.icon}</span> : null}
        {kind === 'timed' ? (
          <DurationChip minutes={rippleDurationMinutes(block, timeZone)} />
        ) : null}
      </span>

      {block.note ? (
        <p data-block-body className="text-ink text-[15px]/[1.65] whitespace-pre-wrap">
          {block.note}
        </p>
      ) : null}

      {photos.map((url, index) =>
        url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" data-photo className="w-full rounded-xl object-cover" />
        ) : (
          <span
            key={index}
            aria-hidden
            data-photo-placeholder
            className="bg-pool-100 block aspect-[4/3] w-full rounded-xl"
          />
        ),
      )}
    </button>
  );
}
