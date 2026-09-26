// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));

import { buildFlow, monthSections, DEFAULT_HOME_MODE } from '@/features/home/flow';
import { HomeFlow } from '@/features/home/home-flow';
import { QUIET_CLUSTER } from '@/features/home/splash-flow-row';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import { summarizeSplash, type Splash } from '@/features/splash/summary';
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';

const TZ = 'America/Vancouver';
const TODAY = '2026-09-25';
const NOW = new Date('2026-09-25T20:00:00.000Z');

beforeEach(() => {
  window.sessionStorage.clear();
  window.scrollBy = () => {};
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

const PLACE: MyCategory = {
  id: 'c-place',
  user_id: 'a1',
  name: 'Place',
  icon: '📍',
  default_mode: 'drop',
  position: 0,
  created_at: '2026-01-01T00:00:00Z',
};

function ripple(over: Partial<RippleWithCategory> = {}): RippleWithCategory {
  return {
    id: 'r1',
    author_id: 'a1',
    category_id: 'c-place',
    note: 'kitsilano beach',
    media: [],
    occurred_on: null,
    occurred_time: null,
    started_at: null,
    ended_at: null,
    planned: false,
    participants: [],
    created_at: '2026-09-25T16:00:00.000Z',
    parent_ripple_id: null,
    splash_id: null,
    category: { name: 'Place', icon: '📍' },
    ...over,
  };
}

function splash(over: Partial<Splash> = {}): Splash {
  return {
    id: 's1',
    owner_id: 'a1',
    title: 'Whistler',
    declared_start: '2026-08-17',
    declared_end: '2026-08-20',
    lane_ids: ['c-place'],
    pool_id: null,
    type: 'free',
    prompt: null,
    ends_at: null,
    created_at: '2026-08-16T16:00:00.000Z',
    ...over,
  };
}

function home(ripples: RippleWithCategory[], boards: Splash[] = []) {
  const splashes = boards.map((b) =>
    summarizeSplash(
      b,
      ripples.filter((r) => r.splash_id === b.id),
      TZ,
      NOW,
    ),
  );
  const sections = monthSections(buildFlow(ripples, splashes, TZ), TZ);
  return render(
    <InputSheetProvider>
      <HomeFlow
        sections={sections}
        splashes={splashes}
        categories={[PLACE]}
        thumbnails={{}}
        timeZone={TZ}
        today={TODAY}
      />
    </InputSheetProvider>,
  );
}

const day = [
  ripple({ id: 'open-member', splash_id: 'open', created_at: '2026-09-25T15:00:00Z' }),
  ripple({ id: 'loose', note: 'parannoul on repeat', created_at: '2026-09-24T15:00:00Z' }),
  ripple({ id: 'settled-member', splash_id: 's1', created_at: '2026-08-18T15:00:00Z' }),
];
const boards = [
  splash({
    id: 'open',
    title: 'During redesign',
    declared_start: null,
    declared_end: null,
    lane_ids: [],
  }),
  splash(),
];

describe('one list, two modes (SPEC 5)', () => {
  it('opens in splash mode by default', () => {
    expect(DEFAULT_HOME_MODE).toBe('splash');
    const { container } = home(day, boards);
    expect(container.querySelector('[data-home-mode]')!.getAttribute('data-home-mode')).toBe(
      'splash',
    );
  });

  it('renders ripples as quiet marks in splash mode: a badge on the rope, no content, no row', () => {
    const { container, queryByText } = home(day, boards);
    const marks = container.querySelectorAll('[data-flow-row="ripple"]');

    expect(marks.length).toBe(3);
    for (const mark of marks) {
      expect(mark.getAttribute('data-presentation')).toBe('quiet');
      expect(mark.className).toContain('float-left');
      expect(mark.className).not.toMatch(/grid|py-3/);
    }
    expect(queryByText('parannoul on repeat')).toBeNull();
    expect(
      container.querySelector('[data-flow-row="ripple"] button span[aria-hidden]')!.textContent,
    ).toBe('📍');
  });

  it('renders splashes as quiet marks in ripple mode: a compact cluster, a + only while open', () => {
    const { container, getAllByLabelText, queryByText } = home(day, boards);
    fireEvent.click(getAllByLabelText('Ripples')[0]);

    const marks = container.querySelectorAll('[data-flow-row="splash"]');
    expect(marks.length).toBe(2);
    for (const mark of marks) {
      expect(mark.getAttribute('data-presentation')).toBe('quiet');
      expect(mark.querySelector('[data-splash-waves]')).not.toBeNull();
      expect(mark.className).toContain('float-right');
      expect(mark.className).toContain(QUIET_CLUSTER);
      expect(mark.querySelector('[data-drop-pill]')).toBeNull();
    }
    // The titles live on the splash rows, and those are quiet now; a member
    // ripple's own splash tag is the one place a title still shows.
    for (const mark of marks) {
      expect(mark.textContent).not.toMatch(/Whistler|During redesign/);
    }
    expect(queryByText('2026. 8. 17 ~ 2026. 8. 20')).toBeNull();
    // The open board keeps a small +; the settled one has nothing but waves.
    expect(
      container.querySelectorAll('[data-flow-row="splash"] button[aria-label="Show splashes"]')
        .length,
    ).toBeGreaterThan(0);
    expect(marks[0].textContent).toContain('+');
    expect(marks[1].textContent).not.toContain('+');
  });

  it('keeps every row’s node across a switch: a refocus, not navigation', () => {
    const { container, getAllByLabelText } = home(day, boards);
    const before = [...container.querySelectorAll('[data-flow-id]')];

    fireEvent.click(getAllByLabelText('Ripples')[0]);
    const after = [...container.querySelectorAll('[data-flow-id]')];

    expect(after.length).toBe(before.length);
    after.forEach((node, index) => expect(node).toBe(before[index]));
    expect(container.querySelector('[data-home-mode]')!.getAttribute('data-home-mode')).toBe(
      'ripple',
    );
  });

  it('switches modes when a quiet mark is tapped', () => {
    const { container, getAllByLabelText } = home(day, boards);
    fireEvent.click(getAllByLabelText('Show ripples')[0]);
    expect(container.querySelector('[data-home-mode]')!.getAttribute('data-home-mode')).toBe(
      'ripple',
    );

    fireEvent.click(getAllByLabelText('Show splashes')[0]);
    expect(container.querySelector('[data-home-mode]')!.getAttribute('data-home-mode')).toBe(
      'splash',
    );
  });

  it('remembers the mode for the session', () => {
    const first = home(day, boards);
    fireEvent.click(first.getAllByLabelText('Ripples')[0]);
    cleanup();

    const second = home(day, boards);
    expect(second.container.querySelector('[data-home-mode]')!.getAttribute('data-home-mode')).toBe(
      'ripple',
    );
  });
});

describe('a splash row (SPEC 5)', () => {
  it('shows +Drop only while the board is open', () => {
    const { container } = home(day, boards);
    const rows = container.querySelectorAll('[data-flow-row="splash"]');
    const open = [...rows].find((r) => r.textContent!.includes('During redesign'))!;
    const settled = [...rows].find((r) => r.textContent!.includes('Whistler'))!;

    expect(open.querySelector('[data-drop-pill]')).not.toBeNull();
    expect(settled.querySelector('[data-drop-pill]')).toBeNull();
  });

  it('always shows a lane chip, outlined, never filled', () => {
    const { container, getAllByText } = home(day, boards);
    const chips = getAllByText('Place');
    expect(chips.length).toBe(2);
    for (const chip of chips) {
      const el = chip.closest('span')!;
      expect(el.className).toContain('border');
      expect(el.className).not.toMatch(/bg-main-900|bg-ink/);
    }
    expect(container.textContent).toContain('2026. 8. 17 ~ 2026. 8. 20');
  });

  it('draws the +Drop pill in the action colour, and the toggle’s active segment in ink (H20f)', () => {
    const { container, getAllByLabelText } = home(day, boards);
    expect(container.querySelector('[data-drop-pill]')!.className).toContain('bg-main-900');

    const active = getAllByLabelText('Splashes')[0];
    expect(active.getAttribute('aria-pressed')).toBe('true');
    expect(active.className).toContain('bg-ink');
    expect(active.className).not.toContain('bg-main-900');
    expect(getAllByLabelText('Ripples')[0].className).not.toContain('bg-ink');
  });
});

describe('the tail and the empty states (H19)', () => {
  it('names the mode’s own ghost', () => {
    const { getByText, getAllByLabelText } = home(day, boards);
    expect(getByText('+ Drop New Splash')).toBeTruthy();
    fireEvent.click(getAllByLabelText('Ripples')[0]);
    expect(getByText('+ Drop New Ripple')).toBeTruthy();
  });

  it('invites the first ripple when there is nothing at all', () => {
    const { getByText } = home([]);
    expect(getByText(EMPTY.trail)).toBeTruthy();
    expect(getByText('+ Drop New Splash')).toBeTruthy();
  });

  it('says what stories are for when there are ripples but no splashes', () => {
    const { getByText, queryByText, getAllByLabelText } = home([ripple()]);
    expect(getByText(EMPTY.splashes)).toBeTruthy();
    fireEvent.click(getAllByLabelText('Ripples')[0]);
    expect(queryByText(EMPTY.splashes)).toBeNull();
  });
});

describe('a quiet mark occupies only its own box (SPEC 5)', () => {
  /** Every row in the flow: the list's direct children, in both modes. */
  function rows(container: HTMLElement): HTMLElement[] {
    return [...container.querySelectorAll<HTMLElement>('ol > [data-flow-row]')];
  }
  const inFlow = (row: HTMLElement): boolean => !/float-(left|right)/.test(row.className);

  it('is the list item itself, floated: no full-row wrapper, no row padding', () => {
    const { container, getAllByLabelText } = home(day, boards);
    // Splash mode: the quiet marks are the badges.
    for (const mark of container.querySelectorAll<HTMLElement>('[data-presentation="quiet"]')) {
      expect(mark.tagName).toBe('LI');
      expect(mark.parentElement!.tagName).toBe('OL');
      expect(mark.className).toMatch(/float-left clear-left/);
      expect(mark.className).not.toMatch(/\bpy-/);
    }
    fireEvent.click(getAllByLabelText('Ripples')[0]);
    // Ripple mode: the quiet marks are the clusters.
    for (const mark of container.querySelectorAll<HTMLElement>('[data-presentation="quiet"]')) {
      expect(mark.tagName).toBe('LI');
      expect(mark.parentElement!.tagName).toBe('OL');
      expect(mark.className).toMatch(/float-right clear-right/);
      expect(mark.className).not.toMatch(/\bpy-/);
    }
  });

  it('leaves the in-flow stack to the full rows alone, in both modes', () => {
    // No layout engine here, so the stack is read structurally: a floated
    // box is out of flow and adds nothing to the column's height, and the
    // full rows are the same boxes with or without quiet marks beside them.
    const withMarks = home(day, boards);
    const full = rows(withMarks.container).filter(inFlow);
    expect(full.map((r) => r.getAttribute('data-presentation'))).toEqual(['full', 'full']);
    expect(rows(withMarks.container).filter((r) => !inFlow(r)).length).toBe(3);
    const fullClasses = full.map((r) => r.className);
    cleanup();

    const alone = home([], boards);
    expect(
      rows(alone.container)
        .filter(inFlow)
        .map((r) => r.className),
    ).toEqual(fullClasses);
    expect(rows(alone.container).filter((r) => !inFlow(r)).length).toBe(0);
    cleanup();

    const ripplesOnly = home(day);
    fireEvent.click(ripplesOnly.getAllByLabelText('Ripples')[0]);
    const rippleRows = rows(ripplesOnly.container);
    expect(rippleRows.every(inFlow)).toBe(true);
    expect(rippleRows.every((r) => r.className.includes('py-3'))).toBe(true);
  });

  it('draws the rope once per month, behind the flow, never per row', () => {
    const { container, getAllByLabelText } = home(day, boards);
    for (const mode of ['splash', 'ripple'] as const) {
      if (mode === 'ripple') fireEvent.click(getAllByLabelText('Ripples')[0]);
      for (const section of container.querySelectorAll('[data-flow-month]')) {
        expect(section.querySelectorAll(':scope > header > [data-rope]').length).toBe(1);
        expect(section.querySelectorAll(':scope > ol > [data-rope]').length).toBe(1);
        expect(section.querySelector('ol')!.className).toContain('flow-root');
      }
      expect(container.querySelector('[data-flow-row] [data-rope]')).toBeNull();
    }
  });
});

describe('a splash entry’s waves (SPEC 5)', () => {
  it('span the entry’s own content block, stretched to it rather than sized', () => {
    const { container } = home(day, boards);
    const entries = container.querySelectorAll<HTMLElement>('[data-splash-entry]');
    expect(entries.length).toBe(2);
    for (const entry of entries) {
      // The entry shrink-wraps inside a right-aligned row.
      expect(entry.parentElement!.className).toContain('justify-end');
      const rule = entry.querySelector<HTMLElement>(':scope > [data-splash-rule]')!;
      expect(rule.className).toContain('self-stretch');
      expect(rule.className).toContain('contain-inline-size');
      expect(rule.className).not.toMatch(/w-\[|w-full|max-w/);
      expect(rule.querySelector('[data-splash-waves]')).not.toBeNull();
    }
  });

  it('keep the pinned geometry at 1.5x, right-anchored and clipped', () => {
    const { container } = home(day, boards);
    const svg = container.querySelector('[data-splash-rule] svg')!;
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMaxYMid slice');
    expect(svg.getAttribute('height')).toBe('6');
  });
});

describe('month sections sink (law 1)', () => {
  it('steps the ground down a month at a time', () => {
    const { container } = home(day, boards);
    const sections = container.querySelectorAll('[data-flow-month]');
    expect(sections[0].getAttribute('data-flow-month')).toBe('2026-09');
    expect((sections[0] as HTMLElement).style.background).toBe('rgb(255, 255, 255)');
    expect(sections[1].getAttribute('data-flow-month')).toBe('2026-08');
    expect((sections[1] as HTMLElement).style.background).toBe('rgb(241, 243, 247)');
  });
});
