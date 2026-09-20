'use client';

/**
 * A typed end that has not happened yet, refused (H18).
 *
 * The refusal carries the way out rather than the rule: where a Timer can be
 * started, the offer keeps the start the author typed and lets the end be
 * written by stopping, which is the record they were describing.
 */
export function StraddleNotice({
  from,
  pending,
  onRunInstead,
}: {
  /** The start, in the author's clock, for the offer's label. */
  from: string;
  pending: boolean;
  /** Absent where no timer may be started: an edit, or inside a session. */
  onRunInstead?: () => void;
}) {
  return (
    <div role="alert" className="bg-pool-100 flex flex-col gap-2 rounded-lg px-3 py-2 text-sm">
      <p className="text-ink">That end hasn&rsquo;t happened yet.</p>
      {onRunInstead ? (
        <button
          type="button"
          disabled={pending}
          onClick={onRunInstead}
          className="text-main-900 self-start font-medium underline-offset-2 hover:underline disabled:opacity-50"
        >
          Start it running from {from} instead
        </button>
      ) : (
        <p className="text-pool-500">Give it an end that has already passed, or clear it.</p>
      )}
    </div>
  );
}
