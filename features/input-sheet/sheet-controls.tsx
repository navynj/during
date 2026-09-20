'use client';

import { useState } from 'react';
import { Lock, Globe } from 'lucide-react';

import type { Audience, Draft } from './draft';

/**
 * UI language is English everywhere (SPEC preamble). The author's timezone
 * governs the value; the format is pinned, because a native time input renders
 * in the *browser's* locale however the value was computed — which is how
 * "오전 09:19" reached an English screen.
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
 * Time is edge UI (SPEC 6): visible, one tap to change, never the thing the
 * eye lands on first. "For the whole day" removes it, which moves the record
 * off the axis into the Daily Note area.
 */
export function TimeControl({
  draft,
  planned,
  timeZone,
  onChange,
}: {
  draft: Draft;
  planned: boolean;
  timeZone: string;
  onChange: (time: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {draft.time === null ? (
        <span className="text-pool-500">For the whole day</span>
      ) : editing ? (
        <input
          type="time"
          lang="en"
          autoFocus
          value={draft.time}
          onChange={(event) => onChange(event.target.value || null)}
          onBlur={() => setEditing(false)}
          aria-label="Time"
          className="text-main-900 border-pool-200 rounded border px-2 py-1 text-sm tabular-nums"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Change the time"
          data-time-label
          className="text-main-900 border-pool-200 rounded border px-2 py-1 text-sm tabular-nums"
        >
          {formatClock(draft.time)}
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange(draft.time === null ? nowIn(timeZone) : null)}
        className="text-pool-500 underline-offset-2 hover:underline"
      >
        {draft.time === null ? 'Give it a time' : 'For the whole day'}
      </button>

      {/* The microcopy SPEC 6 asks for, shown only when it is true. */}
      {planned ? <span className="text-pool-500">Later today — this saves as a plan.</span> : null}
    </div>
  );
}

/** The author's zone, not the server's — day boundaries are theirs. */
function nowIn(timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * One chip cycling the spectrum, not a separate lock toggle: lock is one end
 * of the audience range, not a feature of its own (C8). v1a has two stops.
 */
export function AudienceChip({
  audience,
  onChange,
}: {
  audience: Audience;
  onChange: (next: Audience) => void;
}) {
  const locked = audience === 'only-me';
  const Icon = locked ? Lock : Globe;

  return (
    <button
      type="button"
      onClick={() => onChange(locked ? 'everyone' : 'only-me')}
      className="text-pool-500 hover:bg-pool-100 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs"
    >
      <Icon aria-hidden size={14} />
      {locked ? 'Only me' : 'Everyone'}
    </button>
  );
}
