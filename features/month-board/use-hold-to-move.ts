'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

/** How long a finger rests on a piece before it is taken (G). */
export const HOLD_MS = 250;
/** Moved further before then, the finger is scrolling the board. */
export const SLOP_PX = 6;
/** Held this near the scroller's top or bottom edge, the board scrolls. */
export const EDGE_PX = 56;
/** Its fastest, at the very edge, in pixels a frame. */
const EDGE_SPEED = 14;

type Press = {
  piece: string;
  id: number;
  from: { x: number; y: number };
  last: { x: number; y: number };
  timer: number | null;
  held: boolean;
  /** Where it was taken, and whether the finger has set off from there since. */
  takenAt: { x: number; y: number };
  dragging: boolean;
  /** What scrolls under the board: nudged while the finger nears its edge. */
  scroller: HTMLElement;
  /** How far the edge has scrolled it, in all, since the piece was taken. */
  scrolled: number;
  frame: number | null;
  off: () => void;
};

// One finger holds one piece at a time. Kept outside the piece: becoming
// active draws its frame afresh, more than once, and the press outlives that.
let press: Press | null = null;
// Who draws the lift: told when a piece is taken and when it is let go.
const listeners = new Set<() => void>();
const told = (): void => listeners.forEach((l) => l());

function end(): void {
  if (!press) return;
  if (press.timer !== null) window.clearTimeout(press.timer);
  if (press.frame !== null) window.cancelAnimationFrame(press.frame);
  const wasHeld = press.held;
  press.off();
  press = null;
  if (wasHeld) told();
}

/**
 * A finger is on a piece, holding or carrying it: what would scroll the
 * board to show the piece leaves it be — it is under the finger — since a
 * scroll in flight makes the browser take the touch and cancel the move.
 */
export function holdingPiece(): boolean {
  return press !== null;
}

/**
 * How far the edge has scrolled the board under the held finger, in all:
 * the frame counts that, and only that, as moved. Not the scroller's own
 * position — the board also scrolls itself to keep its place as a part
 * pushed past its edge widens it (0044), and that moves nothing on screen.
 */
export function heldScroll(): number {
  return press?.scrolled ?? 0;
}

/** The nearest box that scrolls vertically around `el`, else the page. */
export function scrollerOf(el: Element | null): HTMLElement {
  for (let at = el?.parentElement ?? null; at; at = at.parentElement) {
    const { overflowY } = getComputedStyle(at);
    if ((overflowY === 'auto' || overflowY === 'scroll') && at.scrollHeight > at.clientHeight)
      return at;
  }
  return (document.scrollingElement ?? document.documentElement) as HTMLElement;
}

/** The piece a finger has taken by holding it, or none: it is drawn lifted. */
export function useHeldPiece(): string | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => (press?.held ? press.piece : null),
    () => null,
  );
}

/**
 * Near the scroller's top or bottom edge, the board scrolls toward it,
 * faster the nearer; the frame counts what scrolled under the finger as
 * moved (board-handles), and a move at the same point redraws it there.
 */
function edgeScroll(): void {
  if (!press?.held) return;
  // Only a piece being carried: one just taken near an edge stays put.
  if (!press.dragging) {
    press.frame = window.requestAnimationFrame(edgeScroll);
    return;
  }
  const { scroller, last, id } = press;
  const page = scroller === document.scrollingElement || scroller === document.documentElement;
  const top = page ? 0 : scroller.getBoundingClientRect().top;
  const bottom = page ? window.innerHeight : scroller.getBoundingClientRect().bottom;
  const into =
    last.y < top + EDGE_PX
      ? last.y - (top + EDGE_PX)
      : last.y > bottom - EDGE_PX
        ? last.y - (bottom - EDGE_PX)
        : 0;
  if (into !== 0) {
    const before = scroller.scrollTop;
    // Instant, never smooth: a scroll in flight makes the browser take the touch.
    scroller.scrollBy({
      top: Math.max(-EDGE_SPEED, Math.min(EDGE_SPEED, (into / EDGE_PX) * EDGE_SPEED)),
      behavior: 'instant',
    });
    press.scrolled += scroller.scrollTop - before;
    if (scroller.scrollTop !== before)
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: last.x,
          clientY: last.y,
          pointerId: id,
          pointerType: 'touch',
          isPrimary: true,
        }),
      );
  }
  press.frame = window.requestAnimationFrame(edgeScroll);
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
 * the drag is never cancelled. Taken, it buzzes briefly and is drawn
 * lifted (useHeldPiece); held near the top or bottom edge, the board
 * scrolls. Touch only; a mouse and the active piece keep their own ways.
 */
export function useHoldToMove({
  piece,
  enabled,
  active,
  onHold,
}: {
  piece: string;
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
      else if (
        press.held &&
        Math.hypot(e.clientX - press.takenAt.x, e.clientY - press.takenAt.y) > SLOP_PX
      )
        press.dragging = true;
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
    // And on what was touched: taken, the piece is drawn afresh and that
    // node leaves the page, yet its touch keeps going to it, never reaching
    // the window — so the refusal must be on the node itself.
    const touched = event.target as EventTarget;
    touched.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
    window.addEventListener('contextmenu', onMenu);
    press = {
      piece,
      id: event.pointerId,
      from: at,
      last: at,
      held: false,
      takenAt: at,
      dragging: false,
      scroller: scrollerOf(event.currentTarget as Element),
      scrolled: 0,
      frame: null,
      timer: window.setTimeout(() => {
        if (!press) return;
        press.timer = null;
        press.held = true;
        press.takenAt = press.last;
        // Taken: a short buzz where the phone has one, the piece drawn lifted.
        navigator.vibrate?.(12);
        told();
        hold.current();
        press.frame = window.requestAnimationFrame(edgeScroll);
      }, HOLD_MS),
      off: () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        window.removeEventListener('touchmove', onTouchMove);
        touched.removeEventListener('touchmove', onTouchMove as EventListener);
        window.removeEventListener('contextmenu', onMenu);
      },
    };
  };
}
