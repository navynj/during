'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** Still on the server, and through hydration: assume the calmer answer. */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * SPEC 7 law 3: the reduced-motion fallback is mandatory, and every design
 * must read correctly when static.
 *
 * The media query is an external store, so it is read as one — no effect, no
 * cascading render, and the setting is honoured if it changes after paint.
 * The server snapshot is `true` so a viewer who asked for less motion never
 * sees a frame of it; the opposite default would flash before correcting.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
