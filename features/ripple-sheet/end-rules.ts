/**
 * The rules an edited end has to pass, kept pure so they can be reasoned about
 * and tested without a request behind them.
 */

export type Before = { started_at: string | null; ended_at: string | null };
export type EndEdit = {
  occurredTime: string | null;
  startInstant: string | null;
  endInstant?: string | null;
};

/**
 * What a record's end becomes after an edit.
 *
 * H17, refined: stop is the only **initial** writer of an end. A running
 * session's end is written by the act of stopping and an edit cannot invent
 * one; once written it is a past fact, and past facts are correctable — the
 * same reasoning that lets `occurred` be edited.
 */
export function resolveEnd(before: Before, edit: EndEdit): string | null {
  // Nothing without a time has an end to speak of.
  if (edit.occurredTime === null) return null;

  // A drop is a point: its end follows its start rather than being set.
  const wasPoint = before.ended_at !== null && before.ended_at === before.started_at;
  if (wasPoint) return edit.startInstant;

  // Still running: only stopping may write this.
  if (before.ended_at === null) return null;

  return edit.endInstant ?? before.ended_at;
}

/**
 * Names the inner ripple an edit would have stranded.
 *
 * "That does not fit" leaves the author hunting; naming the thing in the way
 * is the difference between a refusal and an answer. A break carries no note
 * of its own (H15a2), so it is named by what it is.
 */
export function strayMessage(stray: {
  note: string | null;
  started_at: string | null;
  ended_at: string | null;
  occurred_time: string | null;
}): string {
  const isSpan = stray.ended_at !== null && stray.ended_at !== stray.started_at;
  const label = stray.note ?? (isSpan ? 'the break' : 'the record');
  const at = stray.occurred_time?.slice(0, 5);

  return `That span leaves ${label}${at ? ` at ${at}` : ''} outside this session.`;
}
