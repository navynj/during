// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));
vi.mock('@/features/sessions/actions', () => ({
  titleMonth: () => Promise.resolve({ ok: true }),
  createSession: () => Promise.resolve({ ok: true, session: {} }),
  updateSession: () => Promise.resolve({ ok: true, session: {} }),
  deleteSession: () => Promise.resolve({ ok: true }),
}));
const savedLanes: unknown[] = [];
const orders: string[][] = [];
vi.mock('@/features/lanes/actions', () => ({
  saveLane: (lane: unknown) => {
    savedLanes.push(lane);
    return Promise.resolve({ ok: true });
  },
  reorderLanes: (ids: string[]) => {
    orders.push(ids);
    return Promise.resolve({ ok: true });
  },
  // Settled by the test, so the optimistic state can be observed in flight.
  deleteLane: (id: string) =>
    new Promise((resolve) => {
      deletes.push({ id, resolve });
    }),
}));
const deletes: { id: string; resolve: (outcome: unknown) => void }[] = [];

import { HomeGround } from '@/features/home/home-ground';
import { InputSheetProvider, useInputSheet } from '@/features/input-sheet/sheet-provider';
import { monthCounts, monthSeats, scrubberMonths } from '@/features/sessions/shelves';
import {
  summarizeOrphan,
  summarizeSplash,
  type Splash,
  type SplashBlock,
  type SplashSummary,
} from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';

const TZ = 'America/Vancouver';
const NOW = new Date('2026-09-25T20:00:00.000Z');
const TODAY = '2026-09-25';

const scrolled: { rope: Element | null; row: Element | null }[] = [];
beforeEach(() => {
  scrolled.length = 0;
  Element.prototype.scrollIntoView = function scrollIntoView(this: Element) {
    scrolled.push({ rope: null, row: this });
  };
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

function lane(id: string, name: string, icon: string, position: number): MyCategory {
  return {
    id,
    user_id: 'a1',
    name,
    icon,
    default_mode: 'drop',
    position,
    created_at: '2026-01-01T00:00:00Z',
  };
}
const LANES = [
  lane('c-food', 'Food', '🍜', 0),
  lane('c-place', 'Place', '📍', 1),
  lane('c-day', 'Day', '🖋', 2),
];

function block(id: string, day: string, category = 'c-day', note = id): SplashBlock {
  return {
    id,
    category_id: category,
    note,
    occurred_on: day,
    occurred_time: null,
    created_at: `${day}T16:00:00.000Z`,
  };
}
function post(
  id: string,
  title: string,
  blocks: SplashBlock[],
  over: Partial<Splash> = {},
): SplashSummary {
  return summarizeSplash(
    {
      id,
      owner_id: 'a1',
      title,
      declared_start: null,
      declared_end: null,
      declared_lane_id: null,
      session_id: null,
      pinned_at: null,
      pool_id: null,
      type: 'free',
      prompt: null,
      ends_at: null,
      created_at: '2026-09-01T16:00:00.000Z',
      ...over,
    },
    blocks,
    TZ,
    NOW,
  );
}

const POSTS = [
  post('late', 'Toy Story 5', [block('l', '2026-09-20', 'c-food')]),
  post('early', 'Arnak', [
    block('e1', '2026-09-03'),
    block('e2', '2026-09-04'),
    block('e3', '2026-09-05'),
  ]),
  post('mid', '', [
    block('m', '2026-09-12', 'c-place', 'coffee went cold while I read the whole thing'),
  ]),
  post('soup', 'Beef Short Rib Soup & Alfa Tea', [block('s', '2026-09-08', 'c-food')]),
  post('aug', 'Whistler', [block('a', '2026-08-17', 'c-place')], {
    pinned_at: '2026-09-01T00:00:00Z',
  }),
];

function Dropper({ splash, month }: { splash: SplashSummary; month: string }) {
  const { markDropped } = useInputSheet();
  useEffect(() => markDropped({ splash, month, note: null }), [splash, month, markDropped]);
  return null;
}

function Deleter({ id }: { id: string }) {
  const { markDeleted } = useInputSheet();
  useEffect(() => markDeleted(id), [id, markDeleted]);
  return null;
}

function ground(
  month = '2026-09',
  posts = POSTS,
  dropped: SplashSummary | null = null,
  deleted: string | null = null,
  categories = LANES,
) {
  return render(
    <InputSheetProvider>
      {dropped ? <Dropper splash={dropped} month={month} /> : null}
      {deleted ? <Deleter id={deleted} /> : null}
      <HomeGround
        month={month}
        months={scrubberMonths(posts, TODAY, TZ)}
        counts={monthCounts(posts, TZ)}
        seats={monthSeats(posts, month, TZ)}
        pinned={posts.filter((p) => p.pinnedAt)}
        categories={categories}
        sessions={[]}
        customCounts={{}}
        earliestYear={2026}
        today={TODAY}
        timeZone={TZ}
      />
    </InputSheetProvider>,
  );
}

const rowOf = (container: HTMLElement, laneId: string): HTMLElement =>
  container.querySelector<HTMLElement>(`[data-lane-row="${laneId}"]`)!;
const seatIds = (root: Element): (string | null)[] =>
  [...root.querySelectorAll('[data-seat]')].map((el) => el.getAttribute('data-seat'));

describe('the water ground (H21c)', () => {
  it('is the blue ground, with white pills that draw their waves on a blue disc', () => {
    const { container } = ground();
    expect(container.querySelector('[data-home-ground]')!.className).toContain('water-ground');
    const css = readFileSync('app/globals.css', 'utf8');
    const rule = css.slice(
      css.indexOf('.water-ground {'),
      css.indexOf('}', css.indexOf('.water-ground {')),
    );
    expect(rule).toContain('background-color: var(--color-main-900)');
    expect(rule).toContain('--wave-ink: #ffffff');

    const pill = container.querySelector<HTMLElement>('[data-splash-pill]')!;
    expect(pill.className).toContain('bg-white');
    const mark = pill.querySelector<HTMLElement>('[data-wave-mark]')!;
    expect(mark.className).toContain('bg-main-900');
    expect(mark.style.getPropertyValue('--wave-ink')).toBe('#ffffff');
  });

  it('draws a lone block as the inverse pill: blue, a white/50 border, a white disc', () => {
    const lone = summarizeOrphan(block('r-lone', '2026-09-14', 'c-day', 'alone'), TZ, NOW);
    const { container } = ground('2026-09', [...POSTS, lone]);
    const pill = container.querySelector<HTMLElement>('[data-splash-pill="r-lone"]')!;
    expect(pill.hasAttribute('data-lone')).toBe(true);
    expect(pill.className).toContain('bg-main-900');
    expect(pill.className).toContain('border-white/50');
    const mark = pill.querySelector<HTMLElement>('[data-wave-mark]')!;
    expect(mark.className).toMatch(/(^| )bg-white( |$)/);
    expect(mark.style.getPropertyValue('--wave-ink')).toBe('var(--color-main-900)');
  });
});

describe('lane rows', () => {
  it('seats every post of the month exactly once, on the row of its lane, in lane order', () => {
    const { container } = ground();
    const rows = [...container.querySelectorAll('[data-lane-row]')];
    expect(rows.map((r) => r.getAttribute('data-lane-row'))).toEqual([
      'c-food',
      'c-place',
      'c-day',
    ]);
    expect(seatIds(rowOf(container, 'c-food'))).toEqual(['late', 'soup']);
    expect(seatIds(rowOf(container, 'c-place'))).toEqual(['mid']);
    expect(seatIds(rowOf(container, 'c-day'))).toEqual(['early']);
    expect(seatIds(container)).toHaveLength(4);
  });

  it('reads newest first from the left along a rope', () => {
    const { container } = ground();
    const food = rowOf(container, 'c-food');
    expect(seatIds(food)).toEqual(['late', 'soup']);
    expect(within(food).getByText('Beef Short Rib Soup & Alfa Tea')).toBeTruthy();
  });

  it('labels each row with its emoji over its name, the rope outside the strip', () => {
    const { container } = ground();
    const place = rowOf(container, 'c-place');
    const label = place.querySelector('[data-lane-label]')!;
    expect(label.textContent).toBe('📍Place');
    expect(place.querySelector('[data-rope]')).not.toBeNull();
    expect(place.querySelector('[data-lane-rope] [data-rope]')).toBeNull();
    expect(place.querySelector('[data-lane-rope]')!.className).toContain('overflow-x-auto');
    expect(place.querySelector('[data-lane-rope]')!.className).toContain('touch-pan-x');
    expect(place.querySelector('[data-seat]')!.className).toContain('shrink-0');
  });

  it('keeps every row with an empty rope in a month with nothing: no copy, no collapse', () => {
    const { container, queryByText } = ground('2026-07');
    expect(container.querySelectorAll('[data-lane-row]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-rope]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-seat]')).toHaveLength(0);
    expect(queryByText('A fresh page of water.')).toBeNull();
  });

  it('seats a post by its declared lane over the lane its blocks took', () => {
    const declared = post('decl', 'Declared', [block('d', '2026-09-10', 'c-day')], {
      declared_lane_id: 'c-place',
    });
    const { container } = ground('2026-09', [...POSTS, declared]);
    expect(seatIds(rowOf(container, 'c-place'))).toContain('decl');
    expect(seatIds(rowOf(container, 'c-day'))).not.toContain('decl');
  });

  it('gives posts on no lane of mine one unlabelled row at the end, only when any', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stray = post('stray', 'Elsewhere', [block('x', '2026-09-09', 'c-gone')]);
    const { container } = ground('2026-09', [...POSTS, stray]);
    const rows = [...container.querySelectorAll('[data-lane-row]')];
    expect(rows.map((r) => r.getAttribute('data-lane-row'))).toEqual([
      'c-food',
      'c-place',
      'c-day',
      '',
    ]);
    expect(rows[3].querySelector('[data-lane-label]')!.textContent).toBe('');
    expect(seatIds(rows[3])).toEqual(['stray']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    cleanup();
    const { container: clean } = ground();
    expect(clean.querySelectorAll('[data-lane-row]')).toHaveLength(3);
  });

  it('ends with the seat of a new lane on an empty rope, which opens the lane sheet', () => {
    const { container, getByLabelText, getByRole } = ground();
    const rows = container.querySelector('[data-lane-rows]')!;
    expect(rows.lastElementChild!.hasAttribute('data-new-lane-row')).toBe(true);
    expect(rows.lastElementChild!.querySelector('[data-rope]')).not.toBeNull();
    fireEvent.click(getByLabelText('New lane'));
    expect(getByRole('dialog', { name: 'New lane' })).toBeTruthy();
  });

  it('links a pill to its post’s page, naming the month it came from', () => {
    const { container } = ground();
    expect(container.querySelector('[data-seat="late"] a')!.getAttribute('href')).toBe(
      '/splash/late?from=2026-09',
    );
  });

  it('scrolls on its own: the rows area, not the page', () => {
    const { container } = ground();
    expect(container.querySelector('[data-lane-area]')!.className).toContain('overflow-y-auto');
    expect(container.querySelector('[data-fixed-stack]')!.className).toContain('shrink-0');
  });
});

describe('the post just dropped', () => {
  it('is seated on its lane’s rope at once, scrolled into view, with the ripple at it', () => {
    const fresh = post('fresh', 'Just dropped', [block('f', '2026-09-25', 'c-place')]);
    const { container } = ground('2026-09', POSTS, fresh);
    expect(seatIds(rowOf(container, 'c-place'))).toEqual(['fresh', 'mid']);
    expect(container.querySelector('[data-seat="fresh"] [data-commit-ripple]')).not.toBeNull();
    expect(container.querySelectorAll('[data-commit-ripple]')).toHaveLength(1);
    // Its row was brought into view before the ring painted.
    expect(scrolled.some((s) => s.row?.getAttribute('data-lane-row') === 'c-place')).toBe(true);
    for (const ring of container.querySelectorAll<HTMLElement>('.commit-ring')) {
      expect(ring.style.animationIterationCount).toBe('1');
    }
  });

  it('takes a deleted post off the ground and the pinned bar at once', () => {
    const { container } = ground('2026-08', POSTS, null, 'aug');
    expect(seatIds(container)).toEqual([]);
    expect(container.querySelector('[data-pinned-bar]')).toBeNull();
  });
});

describe('the fixed stack beneath the rows', () => {
  it('keeps the scrubber, its = and the lane icon row, and nothing of Pools or Friends', () => {
    const { container, getByLabelText, queryByText } = ground();
    const stack = container.querySelector('[data-fixed-stack]')!;
    const months = [...stack.querySelectorAll('[data-scrub-month]')];
    expect(months.map((m) => m.getAttribute('data-scrub-month'))).toEqual(['2026-09', '2026-08']);
    expect(months[0].getAttribute('aria-current')).toBe('true');
    expect(months[0].className).toBe(months[1].className);
    expect(months[0].querySelector('[data-month-count]')!.textContent).toBe('4');
    expect(stack.querySelector('[data-manage-sessions]')).not.toBeNull();
    expect(
      stack
        .querySelector('[data-month-scrubber]')!
        .compareDocumentPosition(stack.querySelector('[data-lane-icon-row]')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(getByLabelText('Edit lanes').querySelector('[data-lane-icon]')).not.toBeNull();
    expect(container.querySelector('[data-lane-icon] path[d*="M4 20"]')).not.toBeNull();
    expect(queryByText(/pool|friends|my lanes/i)).toBeNull();
    expect(container.querySelector('[data-lane-header]')).toBeNull();
    expect(container.querySelector('[data-lane-ropes]')).toBeNull();
  });

  it('opens the sessions sheet from the =, unchanged', () => {
    const { container, getByLabelText, getByRole } = ground();
    fireEvent.click(getByLabelText('Manage sessions'));
    expect(
      getByRole('dialog', { name: 'Sessions' }).querySelector('[data-session-schedule]'),
    ).not.toBeNull();
    fireEvent.click(getByLabelText('Close'));
    expect(container.querySelector('[data-sessions-sheet]')).toBeNull();
  });

  it('sits every other month back at 0.3, the scoped one at full strength', () => {
    const { container } = ground('2026-08');
    const items = [...container.querySelectorAll<HTMLElement>('[data-scrub-month]')].map((m) =>
      m.closest('li')!,
    );
    expect(items[1].style.opacity).toBe('1');
    expect(items[0].style.opacity).toBe('0.3');
  });

  it('scopes rather than scrolls: each month is a link to the ground at that month', () => {
    const { container } = ground();
    expect(container.querySelector('[data-scrub-month="2026-08"]')!.getAttribute('href')).toBe(
      '/?m=2026-08',
    );
  });
});

describe('the pinned bar (H21g)', () => {
  it('sits in ink with a chip per pinned post, whatever month is scoped', () => {
    for (const month of ['2026-09', '2026-08']) {
      const { container } = ground(month);
      const bar = container.querySelector('[data-pinned-bar]')!;
      expect(bar.className).toContain('bg-ink');
      const chip = bar.querySelector('[data-pinned-chip="aug"]')!;
      expect(chip.textContent).toContain('Whistler');
      expect(chip.getAttribute('href')).toBe(`/splash/aug?from=${month}`);
      cleanup();
    }
  });

  it('is absent when nothing is pinned', () => {
    const { container } = ground(
      '2026-09',
      POSTS.filter((p) => !p.pinnedAt),
    );
    expect(container.querySelector('[data-pinned-bar]')).toBeNull();
  });
});

describe('the lanes sheet from the lane icon', () => {
  it('edits every lane’s icon and name in one sheet', async () => {
    savedLanes.length = 0;
    const { getByLabelText, getByRole, getByText, container } = ground();
    fireEvent.click(getByLabelText('Edit lanes'));
    const sheet = getByRole('dialog', { name: 'Edit lanes' });
    expect(sheet.querySelectorAll('[data-lane-row]')).toHaveLength(3);
    expect((getByText('Save') as HTMLButtonElement).disabled).toBe(true);
    const food = sheet.querySelector('[data-lane-row="c-food"]')!;
    fireEvent.change(food.querySelector('input[aria-label^="Icon"]')!, {
      target: { value: '🍣' },
    });
    fireEvent.change(food.querySelector('input[aria-label="Lane name"]')!, {
      target: { value: 'Meals' },
    });
    fireEvent.click(getByText('Save'));
    await waitFor(() => expect(savedLanes).toHaveLength(1));
    expect(savedLanes[0]).toEqual({ id: 'c-food', name: 'Meals', icon: '🍣' });
    await waitFor(() => expect(container.querySelector('[data-lanes-sheet]')).toBeNull());
  });

  it('reorders the lanes by dragging a grip, keeping up with a fast drag, and saves the order', async () => {
    orders.length = 0;
    const { getByLabelText, getByRole, getByText } = ground();
    fireEvent.click(getByLabelText('Edit lanes'));
    const sheet = getByRole('dialog', { name: 'Edit lanes' });
    const order = (): (string | null)[] =>
      [...sheet.querySelectorAll('[data-lane-row]')].map((r) => r.getAttribute('data-lane-row'));
    for (const row of sheet.querySelectorAll<HTMLElement>('[data-lane-row]')) {
      row.getBoundingClientRect = () => {
        const index = order().indexOf(row.getAttribute('data-lane-row'));
        return { top: index * 40, height: 40 } as DOMRect;
      };
    }
    const grip = getByLabelText('Move Day');
    fireEvent.pointerDown(grip, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 10 });
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 50 });
    expect(order()).toEqual(['c-food', 'c-day', 'c-place']);
    fireEvent.pointerUp(grip, { pointerId: 1 });
    fireEvent.click(getByText('Save'));
    await waitFor(() => expect(orders).toHaveLength(1));
    expect(orders[0]).toEqual(['c-food', 'c-day', 'c-place']);
  });

  it('deletes an empty lane at once, and brings one with records back with the refusal', async () => {
    deletes.length = 0;
    const { getByLabelText, getByRole, getByText } = ground();
    fireEvent.click(getByLabelText('Edit lanes'));
    const sheet = getByRole('dialog', { name: 'Edit lanes' });
    fireEvent.click(getByLabelText('Delete Day'));
    fireEvent.click(getByText('Delete'));
    await waitFor(() => expect(sheet.querySelector('[data-lane-row="c-day"]')).toBeNull());
    await act(async () =>
      deletes[0].resolve({ ok: false, message: 'This lane holds 2 records, so it stays.' }),
    );
    await waitFor(() =>
      expect(within(sheet).getByText('This lane holds 2 records, so it stays.')).toBeTruthy(),
    );
    expect(sheet.querySelector('[data-lane-row="c-day"]')).not.toBeNull();
  });
});
