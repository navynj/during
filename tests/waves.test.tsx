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
    expect(path.getAttribute('fill')).toBeNull();
  });

  it('takes its ink from the surface, not from a colour of its own (H15c)', () => {
    const { container } = render(<WaveLine />);
    const path = container.querySelector('path')!;

    // One wave, drawn in whatever reads against its ground: blue on light,
    // white on a live surface. A colour class here would pin it to one.
    expect(path.getAttribute('stroke')).toBe('var(--wave-ink)');
    expect(container.querySelector('svg')?.getAttribute('class') ?? '').not.toMatch(/text-main/);
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

  it('travels every line together — the whole record is still flowing (H10)', () => {
    const { container } = render(<WaveBundle durationMinutes={120} state="active" />);
    const paths = container.querySelectorAll('path');

    // Seven counted lines plus the two-line trail, and the trail travels with
    // them: it is the same water, not a separate ornament.
    expect(paths).toHaveLength(9);
    expect(container.querySelectorAll('path.wave-travel')).toHaveLength(paths.length);
  });

  it('gives no line a delay, so a travelling bundle stays in phase', () => {
    const { container } = render(<WaveBundle durationMinutes={120} state="active" />);

    for (const path of container.querySelectorAll('path')) {
      expect((path as SVGElement).style.animationDelay).toBe('');
    }
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

    // Seven counted lines plus the trail: nothing is withheld, only the motion.
    expect(container.querySelectorAll('svg')).toHaveLength(9);
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
    const active = render(<WaveBundle durationMinutes={60} state="active" />);
    const done = render(<WaveBundle durationMinutes={60} state="done" />);

    const moving = active.container.querySelector('path.wave-travel') as SVGPathElement;
    const still = done.container.querySelector('path') as SVGPathElement;

    // The moving line's path is wider than the box it is drawn into.
    expect(moving.getAttribute('d')!.length).toBeGreaterThan(still.getAttribute('d')!.length);
    expect(moving.closest('g')?.getAttribute('transform')).toBe('translate(-10 0)');
  });
});

describe('CommitRing ring opacity', () => {
  it('fades the rings without touching the content beside them', () => {
    const { container, getByTestId } = render(
      <CommitRing ringOpacity={0.35}>
        <span data-testid="content">+</span>
      </CommitRing>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    const ringGroup = wrapper.querySelector('span[aria-hidden]') as HTMLElement;

    expect(ringGroup.style.opacity).toBe('0.35');
    // The outer box carries no fade, so the disc inside stays solid.
    expect(wrapper.style.opacity).toBe('');
    expect(ringGroup.contains(getByTestId('content'))).toBe(false);
  });

  it('is full strength when not asked for', () => {
    const { container } = render(<CommitRing />);
    const ringGroup = container.querySelector('span[aria-hidden]') as HTMLElement;

    expect(ringGroup.style.opacity).toBe('');
  });
});

describe('the trail on a live record', () => {
  it('adds two fading lines below an in-progress bundle', () => {
    const { container } = render(<WaveBundle durationMinutes={120} state="active" />);
    const trail = [...container.querySelectorAll('[data-trail]')] as HTMLElement[];

    expect(trail).toHaveLength(2);
    // Each fainter than the one above it, and never at full strength.
    const opacities = trail.map((el) => Number(el.style.opacity));
    expect(opacities[0]).toBeLessThan(1);
    expect(opacities[1]).toBeLessThan(opacities[0]);
  });

  it('draws the trail below the bundle, not among it', () => {
    const { container } = render(<WaveBundle durationMinutes={120} state="active" />);
    const children = [...container.querySelectorAll('[data-lines] > *')];
    const firstTrail = children.findIndex((el) => el.hasAttribute('data-trail'));

    expect(firstTrail).toBe(7);
    expect(children).toHaveLength(9);
  });

  it('leaves the counted lines at full strength', () => {
    const { container } = render(<WaveBundle durationMinutes={120} state="active" />);
    expect(container.querySelector('[data-lines]')?.getAttribute('data-lines')).toBe('7');
  });

  it('gives a finished or planned record no trail', () => {
    for (const state of ['done', 'planned'] as const) {
      const { container } = render(<WaveBundle durationMinutes={120} state={state} />);
      expect(container.querySelectorAll('[data-trail]')).toHaveLength(0);
      cleanup();
    }
  });

  it('keeps the trail under reduced motion, since it is state and not motion', () => {
    setReducedMotion(true);
    const { container } = render(<WaveBundle durationMinutes={60} state="active" />);

    expect(container.querySelectorAll('[data-trail]')).toHaveLength(2);
    expect(container.querySelectorAll('.wave-travel')).toHaveLength(0);
  });
});

describe('calm water inside a bundle (H15a2)', () => {
  it('leaves exactly the lines the break covers undrawn, in place', () => {
    // 120 minutes is seven lines; a break across the middle third covers the
    // slice whose centre is 0.357, which is the third line.
    const { container } = render(
      <WaveBundle durationMinutes={120} calm={[{ from: 1 / 3, to: 0.5 }]} />,
    );
    const slots = [...container.querySelectorAll('[data-lines] > *')];

    expect(slots).toHaveLength(7);
    expect(slots.filter((el) => el.hasAttribute('data-calm'))).toHaveLength(1);
    expect(slots[2].hasAttribute('data-calm')).toBe(true);
  });

  it('keeps the bundle the same height, so the outline is unbroken', () => {
    const plain = render(<WaveBundle durationMinutes={120} />);
    const plainSlots = plain.container.querySelectorAll('[data-lines] > *').length;
    cleanup();

    const broken = render(<WaveBundle durationMinutes={120} calm={[{ from: 0.2, to: 0.8 }]} />);
    const slots = [...broken.container.querySelectorAll('[data-lines] > *')];

    expect(slots).toHaveLength(plainSlots);
    // The calm slots stand in for lines rather than collapsing.
    for (const slot of slots.filter((el) => el.hasAttribute('data-calm'))) {
      expect((slot as HTMLElement).style.height).not.toBe('');
    }
  });

  it('does not let a wave bleed into the calm stretch', () => {
    const { container } = render(
      <WaveBundle durationMinutes={480} calm={[{ from: 0, to: 0.5 }]} />,
    );
    const slots = [...container.querySelectorAll('[data-lines] > *')];

    // Every slot in the first half is calm; none of them draws a path.
    const firstHalf = slots.slice(0, Math.floor(slots.length / 2));
    for (const slot of firstHalf) {
      expect(slot.hasAttribute('data-calm')).toBe(true);
      expect(slot.querySelector('path')).toBeNull();
    }
  });
});
