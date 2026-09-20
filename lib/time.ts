/**
 * Day boundaries are the author's, not the server's: `occurred_on` is a
 * wall-clock date in the author's timezone, and During is used across
 * Vancouver and Korea from week one.
 */

/** `YYYY-MM-DD`, the shape `occurred_on` takes over the wire. */
export type IsoDate = string;

export function todayIn(timezone: string, now: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function shiftDate(date: IsoDate, days: number): IsoDate {
  // Parsed as UTC so the arithmetic never crosses a DST seam; these are
  // calendar dates, not instants.
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

/** The pager's label: `15 SAT`. Month is rendered separately (SPEC 5). */
export function formatPagerDate(date: IsoDate): { day: string; weekday: string; month: string } {
  const at = new Date(`${date}T00:00:00Z`);
  return {
    day: String(at.getUTCDate()),
    weekday: at.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase(),
    month: at.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }),
  };
}

/** The browser's zone, captured once at profile bootstrap. */
export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
