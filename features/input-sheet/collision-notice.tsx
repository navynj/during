'use client';

// DORMANT (H20b): no surface reaches this since the Splash pivot. Kept, with
// its tests, for P3's Swim. Do not wire it back in; do not delete it.

import type { CommitResult } from './commit';

/**
 * The exclusion constraint, said out loud (H10 item 8). A refusal that only
 * says "no" leaves the author retyping; this names the record in the way and,
 * when that record is a span, offers the one tap that resolves it.
 */
export function CollisionNotice({
  result,
  onNest,
  pending,
}: {
  /** A straddling span has its own notice, because it has its own way out. */
  result: Extract<CommitResult, { ok: false; reason: 'collision' | 'error' }>;
  onNest: (parentId: string) => void;
  pending: boolean;
}) {
  if (result.reason !== 'collision') {
    return (
      <p role="alert" className="text-pool-500 text-sm">
        {result.message}
      </p>
    );
  }

  const name = result.withNote ?? 'another record';

  return (
    <div role="alert" className="bg-pool-100 flex flex-col gap-2 rounded-lg px-3 py-2 text-sm">
      <p className="text-ink">
        That time already belongs to <span className="font-medium">{name}</span>.
      </p>
      {result.canNest ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => onNest(result.withId)}
          className="text-main-900 self-start font-medium underline-offset-2 hover:underline disabled:opacity-50"
        >
          Add it into that session instead
        </button>
      ) : (
        <p className="text-pool-500">Pick another time, or give this one the whole day.</p>
      )}
    </div>
  );
}
