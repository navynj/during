// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/splash/s1',
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));
vi.mock('@/features/splash/actions', () => ({
  deleteSplash: () => Promise.resolve({ ok: true }),
}));

import { InputSheetProvider, useInputSheet } from '@/features/input-sheet/sheet-provider';
import { SplashScreen } from '@/features/splash/splash-screen';
import { summarizeSplash, type Splash } from '@/features/splash/summary';
import type { RippleWithCategory } from '@/lib/queries/ripples';

const TZ = 'America/Vancouver';
const TODAY = '2026-09-25';
const NOW = new Date('2026-09-25T20:00:00.000Z');

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
});
afterEach(cleanup);

function ripple(over: Partial<RippleWithCategory> = {}): RippleWithCategory {
  return {
    id: 'r',
    author_id: 'a1',
    category_id: 'c-place',
    note: 'fixture',
    media: [],
    occurred_on: null,
    occurred_time: null,
    started_at: null,
    ended_at: null,
    planned: false,
    participants: [],
    created_at: '2026-08-18T16:00:00.000Z',
    parent_ripple_id: null,
    splash_id: 's1',
    category: { name: 'Place', icon: '📍' },
    ...over,
  };
}

const board: Splash = {
  id: 's1',
  owner_id: 'a1',
  title: 'Whistler, two nights',
  declared_start: '2026-08-17',
  declared_end: '2026-08-20',
  lane_ids: ['c-place'],
  pool_id: null,
  type: 'free',
  prompt: null,
  ends_at: null,
  created_at: '2026-08-16T16:00:00.000Z',
};

const members = [
  ripple({
    id: 'later',
    note: 'last coffee',
    occurred_on: '2026-08-20',
    occurred_time: '08:40:00',
  }),
  ripple({ id: 'first', note: 'sea to sky', occurred_on: '2026-08-17', occurred_time: '11:30:00' }),
  ripple({
    id: 'night',
    note: 'the village',
    occurred_on: '2026-08-17',
    occurred_time: '21:15:00',
    media: ['a1/x.jpg'],
  }),
];

function Opened() {
  const { sheet } = useInputSheet();
  return <output data-open-sheet>{sheet ? JSON.stringify(sheet) : ''}</output>;
}

function screen() {
  return render(
    <InputSheetProvider>
      <SplashScreen
        splash={summarizeSplash(board, members, TZ, NOW)}
        members={members}
        photos={{ night: [null, 'https://signed/x.jpg'] }}
        timeZone={TZ}
        today={TODAY}
      />
      <Opened />
    </InputSheetProvider>,
  );
}

describe('the splash screen (SPEC 5)', () => {
  it('heads with the range, the title and the count', () => {
    const { container, getByText } = screen();
    expect(container.querySelector('[data-range]')!.textContent).toBe('2026. 8. 17 ~ 2026. 8. 20');
    expect(getByText('Whistler, two nights')).toBeTruthy();
    expect(container.querySelector('[data-count]')!.textContent).toBe('3 Ripples');
  });

  const ids = (container: HTMLElement): (string | null)[] =>
    [...container.querySelectorAll('[data-fragment]')].map((el) =>
      el.getAttribute('data-fragment'),
    );
  const days = (container: HTMLElement): (string | null)[] =>
    [...container.querySelectorAll('[data-splash-day]')].map((el) =>
      el.getAttribute('data-splash-day'),
    );

  it('reads newest first by default, under day labels', () => {
    const { container, getByLabelText } = screen();
    expect(ids(container)).toEqual(['later', 'night', 'first']);
    expect(days(container)).toEqual(['2026-08-20', '2026-08-17']);
    expect(getByLabelText('Order').querySelector('[aria-pressed="true"]')!.textContent).toBe(
      'newest',
    );
  });

  it('reads the story forward when the order is flipped, in ink (H20f)', () => {
    const { container, getByText } = screen();
    fireEvent.click(getByText('oldest'));
    expect(ids(container)).toEqual(['first', 'night', 'later']);
    expect(days(container)).toEqual(['2026-08-17', '2026-08-20']);
    expect(getByText('oldest').className).toContain('bg-ink');
    expect(getByText('newest').className).not.toContain('bg-ink');
    fireEvent.click(getByText('newest'));
    expect(ids(container)).toEqual(['later', 'night', 'first']);
  });

  it('seats the add slot at the head, the first seat on the rope, above the fragments', () => {
    const { container } = screen();
    const slot = container.querySelector('[data-add-slot]')!;
    const first = container.querySelector('[data-fragment]')!;
    expect(slot.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const rope = container.querySelector<HTMLElement>('[data-rope]')!;
    expect(rope.parentElement).toBe(slot.parentElement);
    expect(rope.parentElement!.querySelector('[data-badge]')!.closest('[data-add-slot]')).toBe(
      slot,
    );
    // From the ring to the last badge, never past either.
    expect(rope.parentElement!.style.getPropertyValue('--rope-top')).toMatch(/px$/);
    expect(rope.parentElement!.style.getPropertyValue('--rope-bottom')).toMatch(/px$/);
    expect(container.querySelector('[data-fragment] [data-rope]')).toBeNull();
  });

  it('draws photos inline and large, a quiet tile where one could not be signed', () => {
    const { container } = screen();
    const photo = container.querySelector('[data-photo]')!;
    expect(photo.getAttribute('src')).toBe('https://signed/x.jpg');
    expect(photo.className).toContain('w-full');
    const placeholder = container.querySelector('[data-photo-placeholder]')!;
    expect(placeholder.className).toContain('bg-pool-100');
    expect(
      placeholder.compareDocumentPosition(photo) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('opens the ripple sheet preset to this board from the add slot', () => {
    const { getByLabelText, container } = screen();
    fireEvent.click(getByLabelText('Drop into this splash'));
    expect(container.querySelector('[data-open-sheet]')!.textContent).toContain('"splashId":"s1"');
  });

  it('opens the splash sheet preset to this board from Edit', () => {
    const { getByLabelText, container } = screen();
    fireEvent.click(getByLabelText('Edit this splash'));
    const open = JSON.parse(container.querySelector('[data-open-sheet]')!.textContent!);
    expect(open.kind).toBe('splash');
    expect(open.editing).toEqual({
      id: 's1',
      title: 'Whistler, two nights',
      laneIds: ['c-place'],
      declaredStart: '2026-08-17',
      declaredEnd: '2026-08-20',
    });
  });

  it('says a delete detaches the fragments, never deletes them (H20d)', () => {
    const { getByLabelText, getByText } = screen();
    fireEvent.click(getByLabelText('Delete this splash'));
    expect(getByText('Deletes this splash. Its 3 ripples stay, detached.')).toBeTruthy();
  });

  it('never says thread', () => {
    const { container } = screen();
    expect(container.textContent).not.toMatch(/thread/i);
  });
});
