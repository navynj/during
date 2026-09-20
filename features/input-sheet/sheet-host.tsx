'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ADD_RIPPLE_SLOT_ID } from '@/features/home-daily/time-axis';

import { InputSheet, type SheetContext } from './input-sheet';
import { useInputSheet } from './sheet-provider';

/**
 * Mounts the sheet where the day's data is. Committing closes it and plays the
 * ripple on the real timeline — preview in the rail, arrival on the page (H12).
 */
export function SheetHost({ context }: { context: SheetContext }) {
  const { open, prefill, closeSheet } = useInputSheet();
  const [landed, setLanded] = useState<string | null>(null);
  const router = useRouter();

  if (!open) return <LandingRipple rippleId={landed} onDone={() => setLanded(null)} />;

  return (
    <InputSheet
      context={context}
      prefill={prefill}
      onClose={closeSheet}
      onCommitted={(rippleId) => {
        closeSheet();
        setLanded(rippleId);
        // The row is new, so the page has to re-read before it can be scrolled to.
        router.refresh();
        requestAnimationFrame(() =>
          document.getElementById(ADD_RIPPLE_SLOT_ID)?.scrollIntoView({ block: 'end' }),
        );
      }}
    />
  );
}

/** Nothing else happens after a commit: one ring, no praise (E5). */
function LandingRipple({ rippleId, onDone }: { rippleId: string | null; onDone: () => void }) {
  if (!rippleId) return null;
  setTimeout(onDone, 1800);
  return null;
}
