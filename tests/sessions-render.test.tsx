// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock('next/navigation', () => ({ usePathname: () => '/sessions', useRouter: () => router }));

// Hoisted with the mocks that use them: a vi.mock factory runs before the
// file's own top level.
const { calls, record } = vi.hoisted(() => {
  const calls: { name: string; args: unknown[] }[] = [];
  const record =
    (name: string, result: unknown = { ok: true }) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return Promise.resolve(result);
    };
  return { calls, record };
});
vi.mock('@/features/sessions/actions', () => ({
  titleMonth: record('titleMonth'),
  createSession: record('createSession', { ok: true, session: { id: 'ss-new' } }),
  updateSession: record('updateSession', { ok: true, session: {} }),
  deleteSession: record('deleteSession'),
}));
vi.mock('@/features/splash/actions', () => ({
  setSplashSession: record('setSplashSession'),
}));

import { SessionSchedule } from '@/features/sessions/session-schedule';
import { Shelf } from '@/features/sessions/shelf';
import { sessionSeats, type Session } from '@/features/sessions/shelves';
import { summarizeSplash, type Splash, type SplashBlock } from '@/features/splash/summary';
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';

const TZ = 'America/Vancouver';
const TODAY = '2026-09-25';
const NOW = new Date('2026-09-25T20:00:00.000Z');

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
  lane('c-place', 'Place', '📍', 0),
  lane('c-food', 'Food', '🍜', 1),
  lane('c-day', 'Day', '🖋', 2),
];

function session(over: Partial<Session> & { id: string }): Session {
  return {
    owner_id: 'a1',
    kind: 'custom',
    title: 'Trips',
    month: null,
    declared_start: null,
    declared_end: null,
    lane_id: null,
    created_at: '2026-09-01T00:00:00Z',
    ...over,
  };
}
const AUGUST = session({
  id: 'm-aug',
  kind: 'monthly',
  title: 'The month the form changed',
  month: '2026-08-01',
});
const TRIPS = session({ id: 'ss1', title: 'Trips' });
const RUNS = session({ id: 'ss2', title: 'Food runs', created_at: '2026-08-01T00:00:00Z' });

function block(id: string, day: string, category = 'c-day'): SplashBlock {
  return {
    id,
    category_id: category,
    note: id,
    occurred_on: day,
    occurred_time: null,
    created_at: `${day}T16:00:00.000Z`,
  };
}
function post(id: string, title: string, blocks: SplashBlock[], over: Partial<Splash> = {}) {
  const row: Splash = {
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
  };
  return summarizeSplash(row, blocks, TZ, NOW);
}

beforeEach(() => {
  calls.length = 0;
  router.refresh.mockClear();
  router.push.mockClear();
});
afterEach(cleanup);

function tab(over: Partial<Parameters<typeof SessionSchedule>[0]> = {}) {
  return render(
    <SessionSchedule
      sessions={[AUGUST, TRIPS, RUNS]}
      counts={{ '2026-09': 3, '2026-08': 1 }}
      customCounts={{ ss1: 2 }}
      categories={LANES}
      earliestYear={2025}
      today={TODAY}
      {...over}
    />,
  );
}

describe('the session schedule (SPEC 5, H21e)', () => {
  it('pages years, and lists the months of this year up to now, newest first', () => {
    const { container, getByLabelText } = tab();
    expect(container.querySelector('[data-year-pager]')!.textContent).toContain('2026');
    const rows = [...container.querySelectorAll('[data-month-row]')];
    expect(rows).toHaveLength(9);
    expect(rows[0].getAttribute('data-month-row')).toBe('2026-09');
    expect(rows[8].getAttribute('data-month-row')).toBe('2026-01');
    expect((getByLabelText('Later year') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(getByLabelText('Earlier year'));
    expect(container.querySelectorAll('[data-month-row]')).toHaveLength(12);
    expect((getByLabelText('Earlier year') as HTMLButtonElement).disabled).toBe(true);
  });

  it('marks the current month in blue, shows a title large where one exists, counts at the right', () => {
    const { container } = tab();
    const current = container.querySelector('[data-month-row="2026-09"]')!;
    expect(current.hasAttribute('data-current')).toBe(true);
    expect(current.className).toContain('text-main-900');
    expect(current.className).not.toMatch(/bg-ink|bg-main-900/);
    expect(current.textContent).toContain('3');
    const august = container.querySelector('[data-month-row="2026-08"]')!;
    expect(august.querySelector('[data-month-title]')!.textContent).toBe(
      'The month the form changed',
    );
    expect(august.className).not.toContain('text-main-900');
    expect(container.querySelector('[data-month-row="2026-07"] [data-month-title]')).toBeNull();
  });

  it('navigates a month to Home scoped to it: no separate screen (H21h)', () => {
    const { container } = tab();
    expect(container.querySelector('[data-month-row="2026-08"] a')!.getAttribute('href')).toBe(
      '/?m=2026-08',
    );
  });

  it('titles a month from its row, which is what makes its lazy row', async () => {
    const { getByLabelText } = tab();
    fireEvent.click(getByLabelText('Title September'));
    const input = getByLabelText('Title for September') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'The refounding' } });
    fireEvent.blur(input);
    await waitFor(() => expect(calls.some((c) => c.name === 'titleMonth')).toBe(true));
    expect(calls.find((c) => c.name === 'titleMonth')!.args).toEqual(['2026-09', 'The refounding']);
    expect(router.refresh).toHaveBeenCalled();
  });

  it('lists custom sessions with their counts, newest made first, and makes one', async () => {
    const { container, getByText, getByLabelText } = tab();
    const rows = [...container.querySelectorAll('[data-session-row]')];
    expect(rows.map((r) => r.getAttribute('data-session-row'))).toEqual(['ss1', 'ss2']);
    expect(rows[0].getAttribute('href')).toBe('/sessions/ss1');
    expect(rows[0].textContent).toContain('2');

    fireEvent.click(getByText('+ New session'));
    fireEvent.change(getByLabelText('Session title'), { target: { value: 'Kitchen' } });
    fireEvent.click(getByText('Place'));
    fireEvent.click(getByText('Make the shelf'));
    await waitFor(() => expect(calls.some((c) => c.name === 'createSession')).toBe(true));
    expect(calls.find((c) => c.name === 'createSession')!.args[0]).toEqual({
      title: 'Kitchen',
      declaredStart: null,
      declaredEnd: null,
      laneId: 'c-place',
    });
  });

  it('opens the create form when sent from the post sheet', () => {
    const { container } = tab({ openNew: true });
    expect(container.querySelector('[data-session-form]')).not.toBeNull();
  });
});

const trip = post('trip', 'Whistler', [block('t', '2026-08-02', 'c-place')], { session_id: 'ss1' });
const meal = post('meal', 'The long table', [block('m', '2026-08-20', 'c-food')], {
  session_id: 'ss1',
});
const second = post('second', 'Tofino', [block('s', '2026-09-02', 'c-place')], {
  session_id: 'ss1',
});
const elsewhere = post('elsewhere', 'Ramen week', [block('r', '2026-09-10', 'c-food')], {
  session_id: 'ss2',
});
const loose = post('loose', 'Loose', [block('x', '2026-09-11')]);

function shelf(over: Partial<Parameters<typeof Shelf>[0]> = {}) {
  const all = [trip, meal, second, elsewhere, loose];
  return render(
    <Shelf
      session={TRIPS}
      seats={sessionSeats(all, 'ss1', TZ)}
      others={all.filter((s) => s.sessionId !== 'ss1')}
      sessions={[TRIPS, RUNS]}
      categories={LANES}
      {...over}
    />,
  );
}

describe('a custom shelf (SPEC 5, H21e)', () => {
  it('groups lane-first with ghost-emoji heads, posts oldest first inside each', () => {
    const { container } = shelf();
    const groups = [...container.querySelectorAll('[data-lane-group]')];
    expect(groups.map((g) => g.getAttribute('data-lane-group'))).toEqual(['c-place', 'c-food']);
    expect(groups[0].querySelector('h2')!.textContent).toContain('Place');
    expect(
      [...groups[0].querySelectorAll('[data-seat]')].map((s) => s.getAttribute('data-seat')),
    ).toEqual(['trip', 'second']);
    expect(container.querySelector('[data-lane-groups]')!.className).toContain('sm:grid-cols-2');
  });

  it('renders flat when the shelf declares a lane', () => {
    const { container } = shelf({ session: { ...TRIPS, lane_id: 'c-place' } });
    expect(container.querySelector('[data-lane-groups]')!.hasAttribute('data-flat')).toBe(true);
    expect(container.querySelectorAll('h2')).toHaveLength(0);
    expect(container.querySelectorAll('[data-seat]')).toHaveLength(3);
  });

  it('reuses the home pill on the page ground, and links back through the shelf', () => {
    const { container } = shelf();
    expect(container.querySelector('[data-back-chip]')!.getAttribute('href')).toBe('/');
    const pill = container.querySelector('[data-splash-pill="trip"]')!;
    expect(pill.className).toContain('bg-pool-100');
    expect(pill.querySelector('[data-wave-mark]')).not.toBeNull();
    expect(pill.getAttribute('href')).toBe('/splash/trip?from=session:ss1');
  });

  it('adds an existing post, saying it moves when it was elsewhere', async () => {
    const { getByText, container } = shelf();
    fireEvent.click(getByText('+ Add a post'));
    const ramen = getByText('Ramen week').closest('button')!;
    expect(ramen.querySelector('[data-moves-from]')!.textContent).toBe('moves from Food runs');
    expect(getByText('Loose').closest('button')!.querySelector('[data-moves-from]')).toBeNull();
    fireEvent.click(ramen);
    await waitFor(() => expect(calls.some((c) => c.name === 'setSplashSession')).toBe(true));
    expect(calls.find((c) => c.name === 'setSplashSession')!.args).toEqual(['elsewhere', 'ss1']);
    expect(container.textContent).not.toMatch(/already on|cannot/i);
  });

  it('says what an empty shelf is', () => {
    const { getByText } = shelf({ seats: [] });
    expect(getByText(EMPTY.shelf)).toBeTruthy();
  });
});
