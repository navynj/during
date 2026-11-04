'use client';

import { useEffect, useRef } from 'react';

/** How long a finger rests on a piece before it is taken (G). */
export const HOLD_MS = 300;
/** Moved further before then, the finger is scrolling the board. */
const SLOP_PX = 8;

type Press = {
  id: number;
  from: { x: number; y: number };
  last: { x: number; y: number };
  timer: number | null;
  held: boolean;
  off: () => void;
};

// One finger holds one piece at a time. Kept outside the piece: becoming
// active draws its frame afresh, more than once, and the press outlives that.
let press: Press | null = null;

function end(): void {
  if (!press) return;
  if (press.timer !== null) window.clearTimeout(press.timer);
  press.off();
  press = null;
}

/**
 * For a frame as it mounts: the finger still held on its piece, as the
 * pointer that starts its move from where the finger is now; else none.
 */
export function claimHeldMove(): React.PointerEvent | null {
  if (!press?.held) return null;
  return {
    clientX: press.last.x,
    clientY: press.last.y,
    pointerId: press.id,
    pointerType: 'touch',
    button: 0,
    stopPropagation: () => {},
  } as unknown as React.PointerEvent;
}

/**
 * A phone's edit mode, a piece moved without a tap first (G): a finger held
 * still on a piece for a moment makes it active, and its frame takes the
 * move from that same finger (claimHeldMove). A quick swipe stays a scroll
 * of the board, over pieces as anywhere. Once held, the board does not
 * scroll under the finger: its touchmoves are refused until it lifts, so
 * the drag is never cancelled. Touch only; a mouse and the active piece
 * keep their own ways.
 */
export function useHoldToMove({
  enabled,
  active,
  onHold,
}: {
  enabled: boolean;
  /** This piece is active: its frame takes a press of its own. */
  active: boolean;
  /** The hold is complete: make the piece active. */
  onHold: () => void;
}): (event: React.PointerEvent) => void {
  const hold = useRef(onHold);
  useEffect(() => {
    hold.current = onHold;
  });

  return (event: React.PointerEvent): void => {
    if (!enabled || active || event.pointerType !== 'touch' || press) return;
    const at = { x: event.clientX, y: event.clientY };
    const onMove = (e: PointerEvent): void => {
      if (!press || e.pointerId !== press.id) return;
      press.last = { x: e.clientX, y: e.clientY };
      if (!press.held && Math.hypot(e.clientX - press.from.x, e.clientY - press.from.y) > SLOP_PX)
        end();
    };
    const onUp = (e: PointerEvent): void => {
      if (e.pointerId === press?.id) end();
    };
    // Held: the page must not scroll, nor a long press open a menu.
    const onTouchMove = (e: TouchEvent): void => {
      if (press?.held && e.cancelable) e.preventDefault();
    };
    const onMenu = (e: Event): void => e.preventDefault();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('contextmenu', onMenu);
    press = {
      id: event.pointerId,
      from: at,
      last: at,
      held: false,
      timer: window.setTimeout(() => {
        if (!press) return;
        press.timer = null;
        press.held = true;
        hold.current();
      }, HOLD_MS),
      off: () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('contextmenu', onMenu);
      },
    };
  };
}
