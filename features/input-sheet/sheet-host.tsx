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
export function SheetHost({
  context,
  openWithParent,
}: {
  context: SheetContext;
  /** A session id from `?session=`, handed over by the focus screen. */
  openWithParent?: string;
}) {
  const { open, prefill, closeSheet } = useInputSheet();
  const [dismissedHandoff, setDismissedHandoff] = useState(false);
  const [landed, setLanded] = useState<string | null>(null);
  const router = useRouter();

  // The hand-off opens the sheet by rendering it, not by writing state from an
  // effect: the URL already says the sheet should be open, so asking React to
  // discover that after paint would only add a frame and a cascading render.
  const handingOff = Boolean(openWithParent) && !dismissedHandoff;
  if (!open && !handingOff)
    return <LandingRipple rippleId={landed} onDone={() => setLanded(null)} />;

  function dismiss(): void {
    setDismissedHandoff(true);
    closeSheet();
    if (openWithParent) router.replace('/');
  }

  return (
    <InputSheet
      context={context}
      prefill={open ? prefill : { parentRippleId: openWithParent }}
      onClose={dismiss}
      onCommitted={(rippleId) => {
        dismiss();
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
