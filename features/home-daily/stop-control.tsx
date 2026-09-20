'use client';

import { useState, useTransition } from 'react';

import { formatDuration } from '@/components/ui/chips/duration-chip';
import { stopSessionWithBreak } from '@/features/focus/break';

import { useElapsed } from './use-elapsed';

/**
 * Stop, with a small confirm. H15d: stopping writes an end that cannot be
 * taken back, so it never rides on a tap that also means something else —
 * which is why the old tap-the-duration-chip-to-stop is gone.
 *
 * `tone` is the surface it sits on, not a colour decision of its own.
 */
export function StopControl({
  rippleId,
  since,
  initialMinutes,
  tone,
  variant = 'chip',
  openBreakId = null,
  onStopped,
}: {
  rippleId: string;
  since: string;
  initialMinutes: number;
  tone: 'on-live' | 'on-light';
  /** `primary` is the focus screen's centre control. */
  variant?: 'chip' | 'primary';
  /**
   * A break still running inside this session. Closed first, because a
   * parent's span shrinks to its end and a child still running would be left
   * outside it (H15a2).
   */
  openBreakId?: string | null;
  onStopped?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const minutes = useElapsed(since, initialMinutes);

  const base =
    tone === 'on-live'
      ? 'bg-white text-main-900'
      : 'bg-pool-100 text-main-900 border border-pool-200';

  // Stop is the primary control on the focus screen: the one thing that ends
  // the record gets the size, and Break sits beside it.
  const shape =
    variant === 'primary'
      ? 'h-24 w-24 flex-col rounded-full text-sm font-medium'
      : 'rounded-full px-3 py-1 text-xs font-medium';

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await stopSessionWithBreak(rippleId, openBreakId);
              onStopped?.();
            })
          }
          className={`flex items-center justify-center disabled:opacity-50 ${shape} ${base}`}
        >
          {pending ? 'Stopping…' : 'Stop now'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={`text-xs ${tone === 'on-live' ? 'text-white/80' : 'text-pool-500'}`}
        >
          Keep going
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      // The primary variant splits its label across two lines, which reads
      // poorly aloud; the whole phrase goes on the element instead.
      aria-label={`Stop · ${formatDuration(minutes)}`}
      className={`flex items-center justify-center tabular-nums ${shape} ${base}`}
    >
      {variant === 'primary' ? (
        <>
          <span>Stop</span>
          <span className="text-xs opacity-70">{formatDuration(minutes)}</span>
        </>
      ) : (
        <>Stop · {formatDuration(minutes)}</>
      )}
    </button>
  );
}
