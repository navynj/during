'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import type { IsoDate } from '@/lib/time';

import { annotationLabel, annotationVerdict, type Annotation } from './draft';

/**
 * `+ Add Time` (H20c): an `occurred` annotation for **not-now only**. Unset
 * is the default and means a plain posted fragment; there is no *now*
 * option, because occurred = now says nothing that posting did not already.
 *
 * The picker is a date (default today), an optional time, and `+ end` for a
 * manual span, validated only as end > start. A set annotation collapses to
 * one removable chip.
 */
export function AnnotationControl({
  annotation,
  today,
  onChange,
}: {
  annotation: Annotation | null;
  today: IsoDate;
  onChange: (next: Annotation | null) => void;
}) {
  const [picking, setPicking] = useState(false);

  if (annotation && !picking) {
    return (
      <span
        data-annotation-chip
        className="bg-pool-100 text-pool-500 inline-flex h-[23px] items-center gap-1 rounded-[5px] px-2 text-[10px] tabular-nums"
      >
        <button type="button" onClick={() => setPicking(true)} className="text-ink">
          {annotationLabel(annotation, today)}
        </button>
        <button type="button" aria-label="Remove the time" onClick={() => onChange(null)}>
          <X aria-hidden size={11} />
        </button>
      </span>
    );
  }

  if (!picking) {
    return <QuietAffordance onClick={() => setPicking(true)} label="+ Add Time" />;
  }

  const draft: Annotation = annotation ?? { date: today, time: null, endDate: null, endTime: null };
  const verdict = annotationVerdict(draft);
  const set = (patch: Partial<Annotation>): void => onChange({ ...draft, ...patch });

  return (
    <div
      data-annotation-picker
      className="bg-pool-100 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-xs"
    >
      <input
        type="date"
        lang="en"
        aria-label="Date"
        value={draft.date}
        max={undefined}
        onChange={(event) => event.target.value && set({ date: event.target.value })}
        className="text-ink rounded bg-white px-2 py-1 tabular-nums"
      />
      <input
        type="time"
        lang="en"
        aria-label="Time"
        value={draft.time ?? ''}
        onChange={(event) =>
          set({
            time: event.target.value || null,
            // An end is a time, so losing the time loses the end with it.
            ...(event.target.value ? {} : { endDate: null, endTime: null }),
          })
        }
        className="text-ink rounded bg-white px-2 py-1 tabular-nums"
      />

      {draft.time && !draft.endTime ? (
        <button
          type="button"
          onClick={() => set({ endDate: draft.date, endTime: draft.time })}
          className="text-main-900 font-medium"
        >
          + end
        </button>
      ) : null}

      {draft.endTime ? (
        <>
          <span aria-hidden className="text-pool-500">
            ~
          </span>
          <input
            type="date"
            lang="en"
            aria-label="End date"
            value={draft.endDate ?? draft.date}
            onChange={(event) => event.target.value && set({ endDate: event.target.value })}
            className="text-ink rounded bg-white px-2 py-1 tabular-nums"
          />
          <input
            type="time"
            lang="en"
            aria-label="End time"
            value={draft.endTime}
            onChange={(event) => event.target.value && set({ endTime: event.target.value })}
            className="text-ink rounded bg-white px-2 py-1 tabular-nums"
          />
          <button
            type="button"
            aria-label="Remove the end"
            onClick={() => set({ endDate: null, endTime: null })}
            className="text-pool-500"
          >
            <X aria-hidden size={12} />
          </button>
        </>
      ) : null}

      {verdict === 'backwards' ? (
        <span role="alert" className="text-pool-500">
          ends before it starts
        </span>
      ) : null}

      <button
        type="button"
        disabled={verdict !== 'ok'}
        onClick={() => setPicking(false)}
        className="text-main-900 ml-auto font-medium disabled:opacity-40"
      >
        Done
      </button>
      <button
        type="button"
        onClick={() => {
          onChange(null);
          setPicking(false);
        }}
        className="text-pool-500"
      >
        Clear
      </button>
    </div>
  );
}

/** The two small grey pills under the note field, per the mockup. */
export function QuietAffordance({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="bg-pool-100 text-pool-500 h-[23px] rounded-[5px] px-2.5 text-[10px] disabled:opacity-50"
    >
      {label}
    </button>
  );
}
