/**
 * Where a typed span sits relative to now.
 *
 * H18: kind is end-presence, not provenance — a span typed in is the same
 * claim a timer makes. The one line that cannot be crossed is the present:
 * **the present is written by the Timer.** A span that starts before now and
 * ends after it describes a record that is still happening, and the only
 * honest way to make one of those is to let it run.
 */
export type SpanVerdict = 'none' | 'backwards' | 'past' | 'future' | 'straddles';

export function spanVerdict(start: number, end: number | null, now: number): SpanVerdict {
  if (end === null) return 'none';
  if (end <= start) return 'backwards';
  // Checked before past/future so that a span beginning exactly now is caught:
  // it is a session starting, not a plan.
  if (start <= now && now < end) return 'straddles';
  return end <= now ? 'past' : 'future';
}
