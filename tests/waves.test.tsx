// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WaveBundle, WaveLine } from '@/components/ui/waves';

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

  it('carries its tone as a text color, so currentColor resolves', () => {
    const { container } = render(<WaveLine tone="settled" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('text-main-100');
  });

  it('renders planned dotted', () => {
    const { container } = render(<WaveLine state="planned" />);
    expect(container.querySelector('path')?.getAttribute('stroke-dasharray')).toBe('2 2');
  });
});

describe('WaveBundle', () => {
  it('draws one line per log step, filling the span it is given', () => {
    const { container } = render(<WaveBundle durationMinutes={120} height={80} />);

    expect(container.querySelectorAll('svg')).toHaveLength(7);
    const span = container.querySelector('[data-lines]') as HTMLElement;
    expect(span.style.height).toBe('80px');
  });

  it('puts the category emoji at the bundle head', () => {
    const { getByText } = render(<WaveBundle durationMinutes={60} height={40} emoji="🔍" />);
    expect(getByText('🔍')).toBeTruthy();
  });

  it('grows only the last line, and only while in progress', () => {
    const { container } = render(<WaveBundle durationMinutes={60} height={40} state="active" />);
    const growing = container.querySelectorAll('path.wave-grow');

    expect(growing).toHaveLength(1);
    const paths = [...container.querySelectorAll('path')];
    expect(paths[paths.length - 1]).toBe(growing[0]);
  });

  it('holds still when the record is finished', () => {
    const { container } = render(<WaveBundle durationMinutes={60} height={40} state="done" />);
    expect(container.querySelectorAll('.wave-grow')).toHaveLength(0);
  });
});

describe('reduced motion (law 3)', () => {
  it('emits no animation class at all', () => {
    setReducedMotion(true);
    const { container } = render(<WaveBundle durationMinutes={60} height={40} state="active" />);

    expect(container.querySelectorAll('.wave-grow')).toHaveLength(0);
  });

  it('still renders every wave, so the design reads correctly static', () => {
    setReducedMotion(true);
    const { container } = render(<WaveBundle durationMinutes={120} height={80} state="active" />);

    expect(container.querySelectorAll('svg')).toHaveLength(7);
  });
});
