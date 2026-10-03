import type { WaveState } from '@/components/ui/waves';
import type { Ripple } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

/**
 * SPEC 8 encodes a Ripple's kind in two nullable columns rather than a `kind`
 * enum, so the reading of that encoding lives here, once.
 *
 *   occurred_time  ended_at        kind
 *   -------------  --------------  ----------------------------------------
 *   null           null            date-only  (Daily Note area, SPEC 5.3)
 *   set            = start instant drop
 *   set            null            timed, in progress
 *   set            > start instant timed, finished
 */
export type RippleKind = 'date-only' | 'drop' | 'timed';

/** Wall-clock minutes into the day, for ordering on the axis. */
export function minutesIntoDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Offset between a timezone's wall clock and UTC at a given instant.
 * Intl is the only thing in the platform that knows the rules; reading the
 * formatted parts back as UTC is how the difference is recovered.
 */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const at = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(at.year),
    Number(at.month) - 1,
    Number(at.day),
    Number(at.hour) % 24,
    Number(at.minute),
    Number(at.second),
  );
  // The parts carry whole seconds; the instant's milliseconds would
  // otherwise leak into the offset and shift a sub-second wall clock.
  return asUtc - (instant.getTime() - instant.getUTCMilliseconds());
}

/**
 * The instant an author-local wall clock refers to.
 *
 * Measured twice: the first offset is read at the naive instant, which near a
 * DST change can be on the wrong side of it; the second is read at the
 * corrected instant. Day boundaries are author-local, so this is the only
 * honest way to turn `occurred_on` + `occurred_time` into a point in time.
 */
export function wallClockToInstant(date: IsoDate, time: string, timeZone: string): Date {
  const naive = Date.parse(`${date}T${time}Z`);
  const firstPass = naive - timeZoneOffsetMs(new Date(naive), timeZone);
  return new Date(naive - timeZoneOffsetMs(new Date(firstPass), timeZone));
}

/** The instant a Ripple began, or null for a date-only record. */
export function startInstant(ripple: Ripple, timeZone: string): Date | null {
  if (!ripple.occurred_time || !ripple.occurred_on) return null;
  return wallClockToInstant(ripple.occurred_on, ripple.occurred_time, timeZone);
}

export function rippleKind(ripple: Ripple, timeZone: string): RippleKind {
  // An unannotated fragment (H20c) is a point too: it makes no span claim.
  if (!ripple.occurred_time || !ripple.occurred_on) return ripple.ended_at ? 'drop' : 'date-only';
  if (!ripple.ended_at) return 'timed';

  const start = wallClockToInstant(ripple.occurred_on, ripple.occurred_time, timeZone);
  return Date.parse(ripple.ended_at) > start.getTime() ? 'timed' : 'drop';
}

/** Zero for a drop; the span for a timed. */
export function rippleDurationMinutes(ripple: Ripple, timeZone: string): number {
  if (!ripple.occurred_time || !ripple.occurred_on || !ripple.ended_at) return 0;

  const start = wallClockToInstant(ripple.occurred_on, ripple.occurred_time, timeZone);
  return Math.max(0, Math.round((Date.parse(ripple.ended_at) - start.getTime()) / 60_000));
}

/**
 * How long an in-progress timed has been running, for its line count. Without
 * this a live record would draw one line until the moment it is stopped.
 */
export function elapsedMinutes(ripple: Ripple, timeZone: string, now: Date): number {
  if (!ripple.occurred_time || !ripple.occurred_on) return 0;

  const start = wallClockToInstant(ripple.occurred_on, ripple.occurred_time, timeZone);
  return Math.max(0, Math.round((now.getTime() - start.getTime()) / 60_000));
}

/**
 * A finished timed's end, as the author's own wall clock.
 *
 * `ended_at` is an instant, so it has to be read back in the author's zone or
 * a record made in Seoul would report a Vancouver hour. Null for a drop, whose
 * end equals its start, and for a timer still running.
 */
export function endWallClock(ripple: Ripple, timeZone: string): string | null {
  if (!ripple.occurred_time || !ripple.occurred_on || !ripple.ended_at) return null;

  const start = wallClockToInstant(ripple.occurred_on, ripple.occurred_time, timeZone);
  const end = new Date(ripple.ended_at);
  if (end.getTime() <= start.getTime()) return null;

  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(end);
}

/**
 * Vitality, which after H9 is the only channel a wave has. `planned` is the
 * column, not an inference from the clock: a record is a plan because it was
 * committed as one (SPEC 6), and a plan whose hour has passed stays a plan
 * until it is checked.
 */
export function rippleState(ripple: Ripple): WaveState {
  if (ripple.planned) return 'planned';
  if (ripple.occurred_time && !ripple.ended_at) return 'active';
  return 'done';
}
