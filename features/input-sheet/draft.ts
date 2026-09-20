import type { MyCategory } from '@/lib/queries/profile';
import { todayIn, type IsoDate } from '@/lib/time';
import { wallClockToInstant } from '@/lib/ripple-kind';

/** Two states in v1a, cycled by one chip rather than a separate toggle (C8). */
export type Audience = 'everyone' | 'only-me';

export type Draft = {
  categoryId: string | null;
  note: string;
  /** `null` = "for the whole day": the record leaves the axis (SPEC 6). */
  time: string | null;
  audience: Audience;
  /** Storage paths, never URLs: a URL expires and the row would rot. */
  media: string[];
  /**
   * Only set in edit mode, for a record that has already finished. Times are
   * the unit of truth — exclusion and containment both validate on them — so
   * duration is shown beside these and never typed into.
   */
  endTime?: string | null;
};

export type Prefill = {
  categoryId?: string;
  time?: string;
  /**
   * Set only when the sheet is opened from a running session's focus screen.
   * Inner ripples are composed where their parent is in view (H10), so this
   * arrives as prefill and is never a control inside the sheet.
   */
  parentRippleId?: string;
  /** Opened from the Daily Note prompt: the record belongs to the day, not an hour. */
  allDay?: boolean;
};

export function emptyDraft(categories: MyCategory[], timeZone: string, prefill: Prefill): Draft {
  return {
    categoryId: prefill.categoryId ?? categories[0]?.id ?? null,
    note: '',
    // Time defaults to now; changing it is edge UI (SPEC 6). The Daily Note
    // prompt is the one entrance that starts without one, because that is
    // what it is for.
    time: prefill.allDay ? null : (prefill.time ?? nowTime(timeZone)),
    audience: 'everyone',
    media: [],
  };
}

export function nowTime(timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export function todayFor(timeZone: string): IsoDate {
  return todayIn(timeZone);
}

/**
 * A future time makes this a plan (SPEC 6). Derived rather than toggled: the
 * microcopy is "change the time and it becomes a plan", so the time control is
 * the only thing the author touches.
 */
export function isPlanned(draft: Draft, timeZone: string): boolean {
  if (draft.time === null) return false;
  return draft.time > nowTime(timeZone);
}

/** Only an explicit timer claims duration (E2), and a plan has not started. */
export function canRunTimer(draft: Draft, timeZone: string): boolean {
  return draft.time !== null && !isPlanned(draft, timeZone);
}

/**
 * The draft that corrects an existing Ripple. Edit is the same sheet, not a
 * second editor — there is one place to say what a record is.
 */
export function draftFrom(
  ripple: {
    category_id: string;
    note: string | null;
    occurred_time: string | null;
    media: string[];
    started_at: string | null;
    ended_at: string | null;
  },
  locked: boolean,
  timeZone: string,
): Draft {
  return {
    categoryId: ripple.category_id,
    note: ripple.note ?? '',
    time: ripple.occurred_time ? ripple.occurred_time.slice(0, 5) : null,
    audience: locked ? 'only-me' : 'everyone',
    media: ripple.media,
    endTime: isFinishedSpan(ripple) ? wallClockOf(ripple.ended_at!, timeZone) : null,
  };
}

/** A record that ran for a while and has stopped: the only editable end. */
export function isFinishedSpan(ripple: {
  started_at: string | null;
  ended_at: string | null;
}): boolean {
  return (
    ripple.started_at !== null && ripple.ended_at !== null && ripple.ended_at !== ripple.started_at
  );
}

function wallClockOf(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(instant));
}

/**
 * The instant an edited end refers to.
 *
 * The end keeps whatever *date* it already had, so a session running past
 * midnight can have its end time corrected without the edit quietly dragging
 * it back a day.
 */
export function endInstantFor(originalEnd: string, endTime: string, timeZone: string): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(originalEnd));

  return wallClockToInstant(day, endTime, timeZone).toISOString();
}
