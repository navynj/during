'use client';

import { useLayoutEffect, type RefObject } from 'react';

import type { HomeMode, MonthSection } from './flow';
import { ROPE_START_VAR } from './rope';

/**
 * Measures where the rope begins (SPEC 5): the centre of the first ripple's
 * badge, in the month that holds it. Measured after layout, because what sits
 * above that badge — a splash entry, in either mode — has no fixed height,
 * and re-measured when the list's size changes, because a title can wrap.
 */
export function useRopeStart(
  list: RefObject<HTMLElement | null>,
  mode: HomeMode,
  sections: MonthSection[],
): void {
  useLayoutEffect(() => {
    const month = list.current?.querySelector<HTMLElement>(
      '[data-rope-from="first-badge"]',
    )?.parentElement;
    if (!month) return;

    const measure = (): void => {
      // Offsets are read against the list, the badge's nearest positioned
      // ancestor; the badge itself is positioned but that is its own concern.
      const badge = month.querySelector<HTMLElement>('[data-flow-row="ripple"] button');
      month.style.setProperty(
        ROPE_START_VAR,
        badge ? `${badge.offsetTop + badge.offsetHeight / 2}px` : '100%',
      );
    };
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(month);
    return () => observer.disconnect();
  }, [list, mode, sections]);
}
