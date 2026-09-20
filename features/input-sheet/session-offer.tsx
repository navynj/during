'use client';

import type { RippleWithCategory } from '@/lib/queries/ripples';

/**
 * H10's inner-ripple entry point. Verb-phrased: there is no UI noun for a
 * child record in v1a, and "thread" is banned outright — it collides with the
 * no-chat hypothesis.
 */
export function SessionOffer({
  running,
  filing,
  onToggle,
}: {
  running: RippleWithCategory;
  filing: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!filing)}
      aria-pressed={filing}
      className={`flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm ${
        filing ? 'bg-main-900 text-white' : 'bg-pool-100 text-pool-500'
      }`}
    >
      {running.category?.icon ? <span aria-hidden>{running.category.icon}</span> : null}
      {filing ? 'Adding to this session' : 'Add to this session'}
    </button>
  );
}
