/**
 * Every empty state's copy, in one place.
 *
 * The voice is an invitation, never an absence and never a nudge: a day with
 * nothing in it is a fact about the day, not a failure to record one. No
 * exclamation marks, no "yet" where "yet" implies a debt, no counts of what is
 * missing. Recorded in DECISIONS as the empty-state voice.
 */
export const EMPTY = {
  /** Today, still open — so "so far" rather than a verdict on the day. */
  todayQuiet: 'A quiet day so far.',
  /** A finished day. Stated, not mourned. */
  pastQuiet: 'A quiet day.',
  /** A day ahead: the only one where the absence is of *plans*. */
  futureQuiet: 'Nothing planned yet.',
  lanes: 'Waves gather here as you drop.',
  trail: 'Your trail starts with the first ripple.',
} as const;

/**
 * Which of the three a day gets. Tense, not judgement: today is still open, a
 * past day is finished, and only a future one is missing *plans* rather than
 * records — you cannot have failed to record a day that has not happened.
 */
export function quietDayCopy(date: string, today: string): string {
  if (date > today) return EMPTY.futureQuiet;
  return date === today ? EMPTY.todayQuiet : EMPTY.pastQuiet;
}
