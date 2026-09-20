'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';

import { formatDuration } from '@/components/ui/chips/duration-chip';

import type { Audience, Draft } from './draft';

/**
 * UI language is English everywhere. The author's timezone governs the value;
 * the format is pinned, because a native time input renders in the *browser's*
 * locale however the value was computed — which is how "오전 09:19" reached an
 * English screen.
 */
export function formatClock(time: string): string {
  // `time` is already the author's wall clock, so this formats rather than
  // converts — passing a timezone here would shift it a second time.
  const [hours, minutes] = time.split(':').map(Number);
  const at = new Date(Date.UTC(2000, 0, 1, hours, minutes));

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at);
}

/**
 * Two mutually exclusive segments, one control: a time, or the whole day —
 * and, optionally, an end (H18).
 *
 * A segmented toggle rather than prose links, because the two are states of
 * one thing and the old copy made them read as two separate commands. Selected
 * uses the same grammar as a category chip — solid action colour, white text —
 * so "chosen" looks the same everywhere in the sheet.
 *
 * The end lives inside the same control rather than beside it: `13:33 → 15:00`
 * is one statement about when this happened, and splitting it into two fields
 * would make the span look like a second thing the author is filling in.
 */
export function TimeControl({
  draft,
  planned,
  timeZone,
  onChange,
  onChangeEnd,
  onEditingChange,
  allowAllDay = true,
  allowEnd = true,
  maxEnd,
}: {
  draft: Draft;
  planned: boolean;
  timeZone: string;
  onChange: (time: string | null) => void;
  /** Absent leaves the control end-less: a running session, whose end is stop's to write. */
  onChangeEnd?: (end: string | null) => void;
  onEditingChange?: (editing: boolean) => void;
  /**
   * False inside a session: a child has to lie within its parent's span, and
   * a date-only record has no time to be contained by (H10).
   */
  allowAllDay?: boolean;
  allowEnd?: boolean;
  /**
   * The latest end that has already happened — now, on today's page, and
   * absent on any other day, where every hour is already past.
   */
  maxEnd?: string;
}) {
  const [editing, setEditing] = useState(false);
  const allDay = draft.time === null;
  // All day never takes an end: a day is not a span you can stop inside.
  const endable = allowEnd && !allDay && Boolean(onChangeEnd);
  const end = allDay ? null : draft.endTime;
  const minutes = draft.time && end ? minutesBetween(draft.time, end) : 0;

  function setEditingState(next: boolean): void {
    setEditing(next);
    onEditingChange?.(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="border-pool-200 inline-flex items-center rounded-full border p-0.5">
        {editing && !allDay ? (
          <input
            type="time"
            lang="en"
            autoFocus
            value={draft.time!}
            onChange={(event) => onChange(event.target.value || null)}
            onBlur={() => setEditingState(false)}
            aria-label="Time"
            className="bg-main-900 rounded-full px-2 py-1 text-xs text-white tabular-nums"
          />
        ) : (
          <Segment
            selected={!allDay}
            onClick={() => {
              if (allDay) onChange(nowIn(timeZone));
              else setEditingState(true);
            }}
          >
            <Clock aria-hidden size={13} />
            <span data-time-label>{allDay ? nowIn(timeZone) : formatClock(draft.time!)}</span>
          </Segment>
        )}

        {end ? (
          <>
            <span aria-hidden className="text-pool-500 px-0.5 text-xs">
              &rarr;
            </span>
            <input
              type="time"
              lang="en"
              value={end}
              onChange={(event) => event.target.value && onChangeEnd!(event.target.value)}
              aria-label="End time"
              className="bg-main-900 rounded-full px-2 py-1 text-xs text-white tabular-nums"
            />
            <button
              type="button"
              onClick={() => onChangeEnd!(null)}
              aria-label="Remove the end"
              className="text-pool-500 px-1.5 text-xs"
            >
              &times;
            </button>
          </>
        ) : null}

        {allowAllDay ? (
          <Segment
            selected={allDay}
            onClick={() => {
              onChange(null);
              onChangeEnd?.(null);
            }}
          >
            All day
          </Segment>
        ) : null}
      </div>

      {/* Light, and only where there is a time to end: the default record is a
          point, so the span is asked for rather than offered as a field. */}
      {endable && !end ? (
        <button
          type="button"
          onClick={() => onChangeEnd!(firstEnd(draft.time!, maxEnd))}
          className="text-main-900 text-xs font-medium opacity-60 hover:opacity-100"
        >
          + end
        </button>
      ) : null}

      {end ? (
        <span data-derived-duration className="text-pool-500 text-xs tabular-nums">
          {minutes > 0 ? formatDuration(minutes) : 'ends before it starts'}
        </span>
      ) : null}

      {/* The microcopy SPEC 6 asks for, shown only when it is true. */}
      {planned ? <span className="text-pool-500">Later today — this saves as a plan.</span> : null}
    </div>
  );
}

/**
 * Where a new end starts out. An hour is a guess, but a guess that is visibly
 * wrong is faster to correct than an empty field is to fill, and the author is
 * standing in the control already.
 *
 * Held back to now where now is in the day, so adding an end to something that
 * started half an hour ago proposes a span that has finished rather than one
 * the Timer will have to refuse (H18). A start that *is* now still lands on a
 * straddling span, and that refusal is the right thing to show: what is
 * happening now is the Timer's to write.
 */
function firstEnd(time: string, maxEnd?: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  // Clamped rather than wrapped: an end before its own start is not a span,
  // and a record that crosses midnight is not made by adding an hour.
  const at = Math.min(hours * 60 + minutes + 60, 23 * 60 + 59);
  const anHour = `${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}`;

  return maxEnd && maxEnd > time && maxEnd < anHour ? maxEnd : anHour;
}

function Segment({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums transition-colors ${
        selected ? 'bg-main-900 text-white' : 'text-pool-500'
      }`}
    >
      {children}
    </button>
  );
}

/** The author's zone, not the server's — day boundaries are theirs. */
export function nowIn(timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * One chip cycling the spectrum, not a separate lock toggle: lock is one end
 * of the audience range, not a feature of its own (C8). v1a has two stops, and
 * no avatar — the audience is a state of this record, not a picture of who.
 */
export function AudienceChip({
  audience,
  onChange,
}: {
  audience: Audience;
  onChange: (next: Audience) => void;
}) {
  const locked = audience === 'only-me';

  return (
    <button
      type="button"
      onClick={() => onChange(locked ? 'everyone' : 'only-me')}
      aria-pressed={locked}
      className="border-pool-200 text-pool-500 hover:bg-pool-100 shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium"
    >
      {locked ? 'Only me' : 'Everyone'}
    </button>
  );
}

function minutesBetween(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return th * 60 + tm - (fh * 60 + fm);
}
