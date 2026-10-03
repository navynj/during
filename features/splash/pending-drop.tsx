'use client';

import Link from 'next/link';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import type { IsoDate } from '@/lib/time';

import { shortDay } from './block';

/**
 * The post just dropped, at the head of the wide screen's Trail before the
 * server has it (CLAUDE.md, the principle): its title at display size and
 * its words as a preview, until the re-read carries the real block in.
 */
export function PendingDropHead({ today }: { today: IsoDate }) {
  const { pendingDrop } = useInputSheet();
  if (!pendingDrop) return null;
  const day = pendingDrop.splash.blocks[0]?.day ?? today;
  return (
    <div data-pending-drop className="flex flex-col gap-1 pb-6">
      <span className="text-pool-500 text-[11px] font-medium tabular-nums">
        {day === today ? 'Today' : shortDay(day)}
      </span>
      <Link
        href={`/splash/${pendingDrop.splash.id}?from=${day.slice(0, 7)}`}
        className="flex flex-col gap-1"
      >
        <span className="text-ink text-xl/snug font-semibold">
          {pendingDrop.splash.title.trim() || <span className="opacity-40">Untitled</span>}
        </span>
        {pendingDrop.note ? (
          <span className="text-ink/80 line-clamp-3 text-sm/relaxed font-light">
            {pendingDrop.note}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
