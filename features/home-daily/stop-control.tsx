'use client';

import { useState, useTransition } from 'react';

import { formatDuration } from '@/components/ui/chips/duration-chip';
import { stopSession } from '@/features/input-sheet/commit';

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
  onStopped,
}: {
  rippleId: string;
  since: string;
  initialMinutes: number;
  tone: 'on-live' | 'on-light';
  onStopped?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const minutes = useElapsed(since, initialMinutes);

  const base =
    tone === 'on-live'
      ? 'bg-white text-main-900'
      : 'bg-pool-100 text-main-900 border border-pool-200';

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await stopSession(rippleId);
              onStopped?.();
            })
          }
          className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${base}`}
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
      className={`rounded-full px-3 py-1 text-xs font-medium tabular-nums ${base}`}
    >
      Stop · {formatDuration(minutes)}
    </button>
  );
}
