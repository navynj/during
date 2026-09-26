'use client';

import { useLayoutEffect, type RefObject } from 'react';

import { ROPE_START_VAR } from './rope';

/**
 * Measures where the rope begins (SPEC 5): the centre of the first badge
 * (`data-badge`) in the list whose rope is marked `first-badge`. Measured
 * after layout, because what sits above that badge — a splash entry, in
 * either mode — has no fixed height, and re-measured when the list's size
 * changes, because a title can wrap or a row can arrive.
 *
 * `revision` is whatever re-renders the list's presentation: Home's mode,
 * the splash screen's order.
 */
export function useRopeStart(root: RefObject<HTMLElement | null>, revision: unknown): void {
  useLayoutEffect(() => {
    const list = root.current?.querySelector<HTMLElement>(
      '[data-rope-from="first-badge"]',
    )?.parentElement;
    if (!list) return;

    const measure = (): void => {
      // Offsets are read against the list, the badge's nearest positioned
      // ancestor; the badge itself is positioned but that is its own concern.
      const badge = list.querySelector<HTMLElement>('[data-badge]');
      list.style.setProperty(
        ROPE_START_VAR,
        badge ? `${badge.offsetTop + badge.offsetHeight / 2}px` : '100%',
      );
    };
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [root, revision]);
}
