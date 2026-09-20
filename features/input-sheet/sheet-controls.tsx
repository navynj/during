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
 * Two mutually exclusive segments, one control: a time, or the whole day.
 *
 * A segmented toggle rather than prose links, because the two are states of
 * one thing and the old copy made them read as two separate commands. Selected
 * uses the same grammar as a category chip — solid action colour, white text —
 * so "chosen" looks the same everywhere in the sheet.
 */
export function TimeControl({
  draft,
  planned,
  timeZone,
  onChange,
  onEditingChange,
  allowAllDay = true,
}: {
  draft: Draft;
  planned: boolean;
  timeZone: string;
  onChange: (time: string | null) => void;
  onEditingChange?: (editing: boolean) => void;
  /**
   * False inside a session: a child has to lie within its parent's span, and
   * a date-only record has no time to be contained by (H10).
   */
  allowAllDay?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const allDay = draft.time === null;

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

        {allowAllDay ? (
          <Segment selected={allDay} onClick={() => onChange(null)}>
            All day
          </Segment>
        ) : null}
      </div>

      {/* The microcopy SPEC 6 asks for, shown only when it is true. */}
      {planned ? <span className="text-pool-500">Later today — this saves as a plan.</span> : null}
    </div>
  );
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

/**
 * The end of a finished record, with its duration shown beside it.
 *
 * Duration is not an input. Exclusion and containment both validate on times,
 * so times are the unit of truth; a duration field would be a second way to
 * say the same thing, and the two would disagree the moment one was rounded.
 */
export function EndTimeControl({
  startTime,
  endTime,
  onChange,
}: {
  startTime: string;
  endTime: string;
  onChange: (time: string) => void;
}) {
  const minutes = minutesBetween(startTime, endTime);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-pool-500 text-xs">Ends</span>
      <input
        type="time"
        lang="en"
        value={endTime}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        aria-label="End time"
        className="text-main-900 border-pool-200 rounded border px-2 py-1 text-xs tabular-nums"
      />
      <span data-derived-duration className="text-pool-500 text-xs tabular-nums">
        {minutes > 0 ? formatDuration(minutes) : 'ends before it starts'}
      </span>
    </div>
  );
}

function minutesBetween(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return th * 60 + tm - (fh * 60 + fm);
}
