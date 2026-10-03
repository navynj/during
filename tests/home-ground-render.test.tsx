// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render } from '@testing-library/react';
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
vi.mock('@/features/lanes/actions', () => ({
  saveLane: () => Promise.resolve({ ok: true }),
  deleteLane: () => Promise.resolve({ ok: true }),
}));

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
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';

const TZ = 'America/Vancouver';
const NOW = new Date('2026-09-25T20:00:00.000Z');
const TODAY = '2026-09-25';

const scrolls: number[] = [];
beforeEach(() => {
  scrolls.length = 0;
  window.scrollTo = ((options: ScrollToOptions) => {
    scrolls.push(options.top as number);
  }) as typeof window.scrollTo;
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
  post('aug', 'Whistler', [block('a', '2026-08-17', 'c-place')], {
    pinned_at: '2026-09-01T00:00:00Z',
  }),
];

function Dropper({ id }: { id: string }) {
  const { markDropped } = useInputSheet();
  useEffect(() => markDropped(id), [id, markDropped]);
  return null;
}

function ground(month = '2026-09', posts = POSTS, dropped: string | null = null) {
  return render(
    <InputSheetProvider>
      {dropped ? <Dropper id={dropped} /> : null}
      <HomeGround
        month={month}
        months={scrubberMonths(posts, TODAY, TZ)}
        counts={monthCounts(posts, TZ)}
        seats={monthSeats(posts, month, TZ)}
        pinned={posts.filter((p) => p.pinnedAt)}
        categories={LANES}
        sessions={[]}
        customCounts={{}}
        earliestYear={2026}
        today={TODAY}
      />
    </InputSheetProvider>,
  );
}

const seatIds = (container: HTMLElement): (string | null)[] =>
  [...container.querySelectorAll('[data-seat]')].map((el) => el.getAttribute('data-seat'));

describe('the water ground (H21c)', () => {
  it('is the blue ground, with white pills that draw their waves blue again inside', () => {
    const { container } = ground();
    expect(container.querySelector('[data-home-ground]')!.className).toContain('water-ground');
    const css = readFileSync('app/globals.css', 'utf8');
    const rule = css.slice(
      css.indexOf('.water-ground {'),
      css.indexOf('}', css.indexOf('.water-ground {')),
    );
    expect(rule).toContain('background-color: var(--color-main-900)');
    expect(rule).toContain('--wave-ink: #ffffff');
    expect(rule).toContain('color: #ffffff');

    const pill = container.querySelector<HTMLElement>('[data-splash-pill]')!;
    expect(pill.className).toContain('bg-white');
    // The mark is white waves on a blue disc, per the mockup.
    const mark = pill.querySelector<HTMLElement>('[data-wave-mark]')!;
    expect(mark.className).toContain('bg-main-900');
    expect(mark.style.getPropertyValue('--wave-ink')).toBe('#ffffff');
  });

  it('draws a lone block as the inverse pill: blue, a white/50 border, a bordered blue disc', () => {
    const lone = summarizeOrphan(block('r-lone', '2026-09-14', 'c-day', 'alone'), TZ, NOW);
    const { container } = ground('2026-09', [...POSTS, lone]);
    const pill = container.querySelector<HTMLElement>('[data-splash-pill="r-lone"]')!;
    expect(pill.hasAttribute('data-lone')).toBe(true);
    expect(pill.className).toContain('bg-main-900');
    expect(pill.className).toContain('border-white/50');
    expect(pill.className).toContain('text-white');
    const mark = pill.querySelector<HTMLElement>('[data-wave-mark]')!;
    expect(mark.className).toContain('bg-main-900');
    expect(mark.className).toContain('border-white/50');
    expect(mark.style.getPropertyValue('--wave-ink')).toBe('#ffffff');
  });

  it('never fills a pill or a lane in blue: ink is selection there', () => {
    const { container, getByText } = ground();
    expect(container.querySelector('[data-splash-pill].bg-main-900')).toBeNull();
    fireEvent.click(getByText('Food'));
    expect(getByText('Food').className).toContain('bg-ink');
    expect(getByText('Food').className).not.toContain('bg-main-900');
  });
});

describe('the post grid (H21d)', () => {
  it('lays posts oldest at the top in strict coalesced-key order, wrapping like tags', () => {
    const { container } = ground();
    expect(seatIds(container)).toEqual(['early', 'mid', 'late']);
    // Pills are as wide as their titles and no wider: a wrapping row, not columns.
    expect(container.querySelector('[data-splash-grid]')!.className).toContain('flex-wrap');
    expect(container.querySelector('[data-splash-grid]')!.className).not.toMatch(/grid-cols/);
    expect(container.querySelector('[data-splash-pill]')!.className).not.toMatch(
      /(^| )w-full|flex-1/,
    );
  });

  it('opens scrolled to the bottom: the present-and-writing zone', () => {
    ground();
    expect(scrolls.length).toBeGreaterThan(0);
    expect(scrolls[scrolls.length - 1]).toBe(document.documentElement.scrollHeight);
  });

  it('shows an untitled post’s first words as a ghost title, and sizes the mark by blocks', () => {
    const { container } = ground();
    const mid = container.querySelector('[data-seat="mid"]')!;
    expect(mid.querySelector('[data-ghost-title]')!.textContent).toBe(
      'coffee went cold while I read…',
    );
    expect(
      container.querySelector('[data-seat="early"] [data-wave-mark]')!.getAttribute('data-lines'),
    ).toBe('2');
    expect(
      container.querySelector('[data-seat="late"] [data-wave-mark]')!.getAttribute('data-lines'),
    ).toBe('1');
  });

  it('links a pill to its post’s page, naming the month it came from', () => {
    const { container } = ground();
    expect(container.querySelector('[data-seat="late"] a')!.getAttribute('href')).toBe(
      '/splash/late?from=2026-09',
    );
  });

  it('plays the ripple once at the pill just dropped, and nowhere else', () => {
    const { container } = ground('2026-09', POSTS, 'late');
    const ripple = container.querySelector<HTMLElement>('[data-seat="late"] [data-commit-ripple]')!;
    expect(ripple).not.toBeNull();
    expect(container.querySelectorAll('[data-commit-ripple]')).toHaveLength(1);
    for (const ring of ripple.querySelectorAll<HTMLElement>('.commit-ring')) {
      expect(ring.style.animationIterationCount).toBe('1');
    }
  });
});

describe('the lane header', () => {
  it('counts each lane’s posts this month as waves, and filters the grid on tap', () => {
    const { container, getByText } = ground();
    const food = container.querySelector('[data-lane-filter="c-food"]')!;
    expect(food.querySelector('[data-wave-stack]')!.getAttribute('data-lines')).toBe('1');
    expect(
      container
        .querySelector('[data-lane-filter="c-day"] [data-wave-stack]')!
        .getAttribute('data-lines'),
    ).toBe('1');

    fireEvent.click(getByText('Food'));
    expect(food.getAttribute('aria-pressed')).toBe('true');
    expect(seatIds(container)).toEqual(['late']);

    fireEvent.click(getByText('Food'));
    expect(seatIds(container)).toEqual(['early', 'mid', 'late']);
  });

  it('hangs a rope under every lane, and the seat of a new one', () => {
    const { container } = ground();
    expect(container.querySelectorAll('[data-lane-ropes] > span')).toHaveLength(4);
  });

  it('is the lanes view: its last slot opens the lane sheet for a new lane', () => {
    const { getByLabelText, getByRole } = ground();
    fireEvent.click(getByLabelText('New lane'));
    expect(getByRole('dialog', { name: 'New lane' })).toBeTruthy();
  });
});

describe('the month scrubber (H21d, H21h)', () => {
  it('lists months newest first, each under its year in white, with counts', () => {
    const { container } = ground();
    const months = [...container.querySelectorAll('[data-scrub-month]')];
    expect(months.map((m) => m.getAttribute('data-scrub-month'))).toEqual(['2026-09', '2026-08']);
    expect(months[0].getAttribute('aria-current')).toBe('true');
    // Opacity is the only difference between the scoped month and the rest.
    expect(months[0].className).toBe(months[1].className);
    const years = [...container.querySelectorAll('[data-scrub-year]')];
    expect(years.map((y) => y.textContent)).toEqual(['2026', '2026']);
    for (const year of years) expect(year.parentElement!.className).toContain('text-white');
    expect(months[0].querySelector('[data-month-count]')!.textContent).toBe('3');
    expect(months[1].querySelector('[data-month-count]')!.textContent).toBe('1');
  });

  it('opens the sessions sheet from the = at its left: management is a sheet, not a tab', () => {
    const { container, getByLabelText, getByRole } = ground();
    expect(container.querySelector('[data-sessions-sheet]')).toBeNull();
    fireEvent.click(getByLabelText('Manage sessions'));
    const sheet = getByRole('dialog', { name: 'Sessions' });
    expect(sheet.querySelector('[data-session-schedule]')).not.toBeNull();
    expect(sheet.querySelectorAll('[data-month-row]').length).toBeGreaterThan(0);
    fireEvent.click(getByLabelText('Close'));
    expect(container.querySelector('[data-sessions-sheet]')).toBeNull();
  });

  it('scopes rather than scrolls: each month is a link to the ground at that month', () => {
    const { container } = ground();
    expect(container.querySelector('[data-scrub-month="2026-08"]')!.getAttribute('href')).toBe(
      '/?m=2026-08',
    );
  });

  it('fades the months with distance from the scoped one', () => {
    const { container } = ground('2026-08');
    const items = [...container.querySelectorAll<HTMLElement>('[data-scrub-month]')].map((m) =>
      m.closest('li')!,
    );
    expect(items[1].style.opacity).toBe('1');
    expect(Number(items[0].style.opacity)).toBeLessThan(1);
  });
});

describe('the pinned bar (H21g)', () => {
  it('sits in ink with a chip per pinned post, whatever month is scoped', () => {
    for (const month of ['2026-09', '2026-08']) {
      const { container } = ground(month);
      const bar = container.querySelector('[data-pinned-bar]')!;
      expect(bar.className).toContain('bg-ink');
      expect(bar.className).not.toContain('bg-main-900');
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

describe('an empty month (H19, H21)', () => {
  it('is a fresh page of water, in white, with nothing else to tap', () => {
    const { container, getByText } = ground('2026-07');
    const line = getByText(EMPTY.ground);
    expect(line.className).toContain('text-white');
    expect(container.querySelector('[data-splash-grid]')).toBeNull();
    // Only the lanes view and the = remain tappable: nothing on the ground creates.
    expect(
      container.querySelector(
        '[data-home-ground] button:not([data-lane-filter]):not([data-new-lane]):not([data-manage-sessions])',
      ),
    ).toBeNull();
  });
});
