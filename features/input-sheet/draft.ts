import type { MyCategory } from '@/lib/queries/profile';
import { todayIn, type IsoDate } from '@/lib/time';

/** Two states in v1a, cycled by one chip rather than a separate toggle (C8). */
export type Audience = 'everyone' | 'only-me';

export type Draft = {
  categoryId: string | null;
  note: string;
  /** `null` = "for the whole day": the record leaves the axis (SPEC 6). */
  time: string | null;
  audience: Audience;
  /** Set when filing into a running session — an inner ripple (H10). */
  parentRippleId: string | null;
};

export type Prefill = { categoryId?: string; time?: string };

export function emptyDraft(categories: MyCategory[], timeZone: string, prefill: Prefill): Draft {
  return {
    categoryId: prefill.categoryId ?? categories[0]?.id ?? null,
    note: '',
    // Time defaults to now; changing it is edge UI (SPEC 6).
    time: prefill.time ?? nowTime(timeZone),
    audience: 'everyone',
    parentRippleId: null,
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
