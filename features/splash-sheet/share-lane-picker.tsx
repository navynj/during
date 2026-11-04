'use client';

import { useEffect, useRef } from 'react';

import { CategoryChip } from '@/components/ui/chips/category-chip';
import { PoolSheet, SheetTitle } from '@/features/pool/sheet';
import type { AudiencePool } from '@/features/pool/audience-sheet';
import { useWide } from '@/components/ui/use-wide';

/**
 * One pool's lanes, to move a record shared there to another (H75): the
 * lane row's own chips, the current one selected. A small popover under
 * Share to on a wide screen; a bottom sheet on a phone. Picking one closes it.
 */
export function ShareLanePicker({
  pool,
  current,
  onPick,
  onClose,
}: {
  pool: AudiencePool;
  current: string | null;
  onPick: (laneId: string) => void;
  onClose: () => void;
}) {
  const wide = useWide();
  const chips = (
    <div
      data-share-lanes={pool.id}
      role="group"
      aria-label={`Lane in ${pool.name}`}
      className="flex flex-wrap gap-1.5"
    >
      {pool.lanes.map((lane) => (
        <CategoryChip
          key={lane.id}
          icon={lane.icon}
          name={lane.name}
          selected={lane.id === current}
          onSelect={() => {
            onPick(lane.id);
            onClose();
          }}
        />
      ))}
    </div>
  );
  if (!wide) {
    return (
      <PoolSheet label={`Lane in ${pool.name}`} onClose={onClose}>
        <SheetTitle>Lane in {pool.name}</SheetTitle>
        <div className="pb-8">{chips}</div>
      </PoolSheet>
    );
  }
  return <Popover onClose={onClose}>{chips}</Popover>;
}

function Popover({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  // Closed by a press outside it, or Escape; the press on its own chip
  // toggles it in the row.
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (box.current?.contains(target) || target?.closest('[data-share-lane]')) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Only the popover: the sheet under it stays open.
      event.stopPropagation();
      onClose();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);
  return (
    <div
      ref={box}
      data-share-lane-popover
      className="surface absolute top-full left-0 z-30 mt-2 max-w-sm rounded-2xl bg-white p-3 shadow-lg"
    >
      {children}
    </div>
  );
}
