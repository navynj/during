// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CommitRing, WaveBundle, WaveLine } from '@/components/ui/waves';

/**
 * jsdom has no matchMedia, and the reduced-motion gate is the whole point of
 * these tests, so it is stubbed per-test rather than globally.
 */
function setReducedMotion(reduce: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: reduce,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => setReducedMotion(false));
afterEach(cleanup);

describe('WaveLine', () => {
  it('is stroke only — a filled shape would read as a block (F3)', () => {
    const { container } = render(<WaveLine />);
    const path = container.querySelector('path')!;

    expect(container.querySelector('svg')?.getAttribute('fill')).toBe('none');
    expect(path.getAttribute('stroke')).toBe('currentColor');
    expect(path.getAttribute('fill')).toBeNull();
  });

  it('carries its color as a text class, so currentColor resolves', () => {
    const { container } = render(<WaveLine />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('text-main-900');
  });

  it('fades planned rather than dashing it', () => {
    const { container } = render(<WaveLine state="planned" />);
    const svg = container.querySelector('svg') as SVGElement;

    expect(Number(svg.style.opacity)).toBeLessThan(1);
    expect(container.querySelector('path')?.getAttribute('stroke-dasharray')).toBeNull();
  });
});

describe('WaveBundle', () => {
  it('draws one line per log step', () => {
    const { container } = render(<WaveBundle durationMinutes={120} />);
    expect(container.querySelectorAll('svg')).toHaveLength(7);
  });

  it('keeps the same gap whatever the duration', () => {
    const short = render(<WaveBundle durationMinutes={25} />);
    const long = render(<WaveBundle durationMinutes={480} />);

    const gapOf = (c: HTMLElement): string =>
      (c.querySelector('[data-lines]') as HTMLElement).style.gap;

    expect(gapOf(short.container)).toBe(gapOf(long.container));
    // Only the count moves.
    expect(short.container.querySelectorAll('svg').length).toBeLessThan(
      long.container.querySelectorAll('svg').length,
    );
  });

  it('puts the category emoji at the bundle head', () => {
    const { getByText } = render(<WaveBundle durationMinutes={60} emoji="🔍" />);
    expect(getByText('🔍')).toBeTruthy();
  });

  it('grows only the last line, and only while in progress', () => {
    const { container } = render(<WaveBundle durationMinutes={60} state="active" />);
    const growing = container.querySelectorAll('path.wave-travel');

    expect(growing).toHaveLength(1);
    const paths = [...container.querySelectorAll('path')];
    expect(paths[paths.length - 1]).toBe(growing[0]);
  });

  it('holds still when the record is finished', () => {
    const { container } = render(<WaveBundle durationMinutes={60} state="done" />);
    expect(container.querySelectorAll('.wave-travel')).toHaveLength(0);
  });
});

describe('reduced motion (law 3)', () => {
  it('emits no animation class at all', () => {
    setReducedMotion(true);
    const { container } = render(<WaveBundle durationMinutes={60} state="active" />);

    expect(container.querySelectorAll('.wave-travel')).toHaveLength(0);
  });

  it('still renders every wave, so the design reads correctly static', () => {
    setReducedMotion(true);
    const { container } = render(<WaveBundle durationMinutes={120} state="active" />);

    expect(container.querySelectorAll('svg')).toHaveLength(7);
  });
});

describe('planned fades as one piece', () => {
  it('puts the opacity on the wrapper so the category badge fades too', () => {
    const { container, getByText } = render(
      <WaveBundle durationMinutes={60} state="planned" emoji="🔍" />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(Number(wrapper.style.opacity)).toBeLessThan(1);
    expect(wrapper.contains(getByText('🔍'))).toBe(true);
  });

  it('does not fade the lines a second time', () => {
    const { container } = render(<WaveBundle durationMinutes={60} state="planned" />);

    for (const svg of container.querySelectorAll('svg')) {
      expect((svg as SVGElement).style.opacity).toBe('');
    }
  });
});

describe('the active line travels rather than stretches', () => {
  it('draws a longer path and clips it, instead of scaling', () => {
    const { container } = render(<WaveBundle durationMinutes={60} state="active" />);
    const moving = container.querySelector('path.wave-travel') as SVGPathElement;
    const still = container.querySelector('path:not(.wave-travel)') as SVGPathElement;

    // The moving line's path is wider than the box it is drawn into.
    expect(moving.getAttribute('d')!.length).toBeGreaterThan(still.getAttribute('d')!.length);
    expect(moving.closest('g')?.getAttribute('transform')).toBe('translate(-10 0)');
  });
});

describe('CommitRing opacity', () => {
  it('fades rings and content together from the wrapper', () => {
    const { container } = render(
      <CommitRing opacity={0.35}>
        <span data-testid="content">+</span>
      </CommitRing>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('0.35');
    expect(wrapper.querySelector('[data-testid="content"]')).toBeTruthy();
  });

  it('is full strength when not asked for', () => {
    const { container } = render(<CommitRing />);
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe('');
  });
});
