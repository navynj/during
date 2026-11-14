'use client';

import { useEffect } from 'react';

/** Keys that move focus: the ring shows after these, and only these. */
const NAVIGATION = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
]);

/**
 * The focus ring for the keyboard alone (H78n). `:focus-visible` is not
 * enough: a browser counts any focused text field as visible focus, so a
 * sheet that focuses its field on open drew the ring with no key pressed.
 * Moving focus by key marks <html> `data-keyboard`; any press of a pointer
 * clears it. globals.css draws the ring only under the mark.
 */
export function FocusModality(): null {
  useEffect(() => {
    const root = document.documentElement;
    const key = (event: KeyboardEvent): void => {
      if (NAVIGATION.has(event.key)) root.dataset.keyboard = '';
    };
    const pointer = (): void => {
      delete root.dataset.keyboard;
    };
    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', pointer, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('pointerdown', pointer, true);
    };
  }, []);
  return null;
}
