'use client';

import { useLayoutEffect, type RefObject } from 'react';

import { ROPE_END_VAR, ROPE_START_VAR } from './rope';

/**
 * Measures each rope's span (SPEC 5): from the centre of the first seat on
 * it to the centre of the last (`data-badge`: the ghost ring, the badges),
 * never past either. Measured after layout rather than assumed, and
 * re-measured when a list's size changes, because a row can arrive.
 *
 * `revision` is whatever re-renders the lists' presentation: Home's mode,
 * the splash screen's order.
 */
export function useRopeSpan(root: RefObject<HTMLElement | null>, revision: unknown): void {
  useLayoutEffect(() => {
    const lists = [...(root.current?.querySelectorAll<HTMLElement>('[data-rope]') ?? [])].map(
      (rope) => rope.parentElement!,
    );
    if (lists.length === 0) return;

    const measure = (): void => {
      for (const list of lists) {
        // Offsets are read against the list, the seats' nearest positioned
        // ancestor; a seat itself is positioned but that is its own concern.
        const seats = list.querySelectorAll<HTMLElement>('[data-badge]');
        const first = seats[0];
        const last = seats[seats.length - 1];
        const centre = (seat: HTMLElement): number => seat.offsetTop + seat.offsetHeight / 2;
        // Nothing on the rope: no rope.
        list.style.setProperty(ROPE_START_VAR, first ? `${centre(first)}px` : '100%');
        list.style.setProperty(
          ROPE_END_VAR,
          last ? `${list.clientHeight - centre(last)}px` : '0px',
        );
      }
    };
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    for (const list of lists) observer.observe(list);
    return () => observer.disconnect();
  }, [root, revision]);
}
