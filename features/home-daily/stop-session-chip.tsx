'use client';

import { useState, useTransition } from 'react';

import { LiveDurationChip } from '@/components/ui/chips/duration-chip';
import { stopSession } from '@/features/input-sheet/commit';

/**
 * The running bundle's duration chip is the stop affordance: the thing showing
 * the elapsed time is the thing that ends it. One small confirm, because
 * stopping is not undoable from here — the timer's span is what it is.
 */
export function StopSessionChip({
  rippleId,
  since,
  initialMinutes,
}: {
  rippleId: string;
  since: string;
  initialMinutes: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await stopSession(rippleId)))}
          className="bg-main-900 rounded px-2 py-0.5 font-medium text-white disabled:opacity-50"
        >
          Stop now
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-pool-500">
          Keep going
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} aria-label="Stop this session">
      <LiveDurationChip since={since} initialMinutes={initialMinutes} />
    </button>
  );
}
