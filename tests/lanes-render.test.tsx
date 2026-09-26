// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/lanes',
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));
const saved: unknown[] = [];
vi.mock('@/features/lanes/actions', () => ({
  saveLane: (lane: unknown) => {
    saved.push(lane);
    return Promise.resolve({ ok: true });
  },
  deleteLane: () => Promise.resolve({ ok: true }),
}));

import { LanesMatrix } from '@/features/lanes/lanes-matrix';
import { laneRows } from '@/features/lanes/matrix';
import { Trail } from '@/features/locker/trail';
import { EMPTY, quietDayCopy } from '@/lib/empty-states';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import type { LaneCounts } from '@/lib/queries/lanes';
import type { MyCategory } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { groupByDay } from '@/lib/queries/trail';

const TZ = 'America/Vancouver';
const NOW = new Date('2027-07-08T20:00:00.000Z');
const FOCUS = 'c-focus';

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

function category(over: Partial<MyCategory> = {}): MyCategory {
  return {
    id: FOCUS,
    user_id: 'a1',
    name: 'Focus',
    icon: '🔍',
    default_mode: 'timed',
    position: 0,
    created_at: '2027-01-01T00:00:00Z',
    ...over,
  };
}

function ripple(over: Partial<RippleWithCategory> = {}): RippleWithCategory {
  return {
    id: 'r1',
    author_id: 'a1',
    category_id: FOCUS,
    note: 'a private thought',
    media: [],
    occurred_on: '2027-07-08',
    occurred_time: '09:00:00',
    started_at: '2027-07-08T16:00:00.000Z',
    ended_at: '2027-07-08T16:00:00.000Z',
    planned: false,
    participants: [],
    created_at: '2027-07-08T16:00:00.000Z',
    parent_ripple_id: null,
    splash_id: null,
    category: { name: 'Focus', icon: '🔍' },
    ...over,
  };
}

function matrix(counts: LaneCounts, categories = [category()]) {
  // Earliest comes from the data, as it does on the page: an archive with
  // nothing in it has no first day, which is what makes the matrix empty.
  const earliest = [...counts.keys()].sort()[0] ?? null;

  return render(
    <LanesMatrix categories={categories} rows={laneRows('2027-07-08', earliest, counts)} />,
  );
}

describe('the matrix keeps its labels in view', () => {
  it('holds the column headers at the top of the scroll', () => {
    const { container } = matrix(new Map([['2027-07-08', { [FOCUS]: 2 }]]));

    const header = container.querySelector('[data-sticky-header]')!;
    expect(header.className).toContain('sticky');
    expect(header.className).toContain('top-0');
  });

  it('holds the date column at the left edge while the lanes scroll sideways', () => {
    const { getByText } = matrix(new Map([['2027-07-08', { [FOCUS]: 2 }]]));

    const gutter = getByText('8').closest('div')!;
    expect(gutter.className).toContain('sticky');
    expect(gutter.className).toContain('left-0');
  });

  it('draws a cell as an impression and an empty one as nothing at all', () => {
    const { container } = matrix(new Map([['2027-07-08', { [FOCUS]: 4 }]]), [
      category(),
      category({ id: 'c-place', name: 'Place', icon: '📍', position: 1 }),
    ]);

    const cells = container.querySelectorAll('[data-lane-cell]');
    expect(cells[0].getAttribute('data-lines')).toBe('3');
    expect(cells[1].getAttribute('data-lines')).toBe('0');
  });

  it('opens the day itself when a cell is tapped', () => {
    const { container } = matrix(new Map([['2027-07-08', { [FOCUS]: 1 }]]));

    expect(container.querySelector('[data-lane-cell]')!.getAttribute('href')).toBe(
      '/?d=2027-07-08',
    );
  });

  it('opens a lane on its own header, and nothing about mappings', () => {
    const { getByText, getByLabelText } = matrix(new Map([['2027-07-08', { [FOCUS]: 1 }]]));

    fireEvent.click(getByText('Focus'));

    expect(getByLabelText('Edit this lane')).toBeTruthy();
    expect((getByLabelText('Lane name') as HTMLInputElement).value).toBe('Focus');
  });
});

describe('a lane that does not exist yet', () => {
  it('suggests its glyph rather than filling one in', () => {
    const { getByLabelText } = matrix(new Map([['2027-07-08', { [FOCUS]: 1 }]]));
    fireEvent.click(getByLabelText('New lane'));

    const icon = getByLabelText('Icon') as HTMLInputElement;
    expect(icon.value).toBe('');
    expect(icon.placeholder).toBe('🌊');
  });

  it('takes the suggestion when the author never picks one', () => {
    saved.length = 0;
    const { getByLabelText, getByText } = matrix(new Map([['2027-07-08', { [FOCUS]: 1 }]]));
    fireEvent.click(getByLabelText('New lane'));
    fireEvent.change(getByLabelText('Lane name'), { target: { value: 'Reading' } });
    fireEvent.click(getByText('Add lane'));

    expect(saved[0]).toMatchObject({ id: null, name: 'Reading', icon: '🌊' });
  });

  it("keeps an existing lane's own glyph as a value, not a suggestion", () => {
    const { getByText, getByLabelText } = matrix(new Map([['2027-07-08', { [FOCUS]: 1 }]]));
    fireEvent.click(getByText('Focus'));

    expect((getByLabelText('Icon') as HTMLInputElement).value).toBe('🔍');
  });
});

describe('locked records are not marked as locked', () => {
  it('leaves a matrix cell counting them like any other', () => {
    // The count cannot distinguish them, which is the point: this view is
    // mine alone, and lock state lives in the detail sheet.
    const { container } = matrix(new Map([['2027-07-08', { [FOCUS]: 2 }]]));

    expect(container.textContent).not.toMatch(/lock|only me/i);
  });

  it('leaves a Trail row reading exactly like an unlocked one', () => {
    const { container, getByText } = render(
      <InputSheetProvider>
        <Trail days={groupByDay([ripple()], TZ)} timeZone={TZ} now={NOW} />
      </InputSheetProvider>,
    );

    expect(getByText('a private thought')).toBeTruthy();
    expect(container.textContent).not.toMatch(/only me/i);
  });
});

describe('the Trail is a backward scroll, not a feed', () => {
  it('sinks each month a step further down (law 1)', () => {
    const { container } = render(
      <InputSheetProvider>
        <Trail
          days={groupByDay(
            [
              ripple({ id: 'now', occurred_on: '2027-07-08' }),
              ripple({ id: 'then', occurred_on: '2027-05-02' }),
            ],
            TZ,
          )}
          timeZone={TZ}
          now={NOW}
        />
      </InputSheetProvider>,
    );

    const sections = container.querySelectorAll('[data-trail-day]');
    expect((sections[0] as HTMLElement).style.background).toBe('rgb(255, 255, 255)');
    expect((sections[1] as HTMLElement).style.background).toBe('rgb(216, 220, 232)');
  });

  it('sends a day header back to that day on Home', () => {
    const { container } = render(
      <InputSheetProvider>
        <Trail days={groupByDay([ripple()], TZ)} timeZone={TZ} now={NOW} />
      </InputSheetProvider>,
    );

    expect(container.querySelector('a')!.getAttribute('href')).toBe('/?d=2027-07-08');
  });
});

describe('every empty state says something', () => {
  it('leaves today open', () => {
    expect(quietDayCopy('2027-07-08', '2027-07-08')).toBe('A quiet day so far.');
  });

  it('states a finished day rather than mourning it', () => {
    expect(quietDayCopy('2027-07-07', '2027-07-08')).toBe('A quiet day.');
  });

  it('asks a day ahead about plans, not records', () => {
    expect(quietDayCopy('2027-07-09', '2027-07-08')).toBe('Nothing planned yet.');
  });

  it('invites the first drop where no lane has anything yet', () => {
    const { getByText } = matrix(new Map());
    expect(getByText(EMPTY.lanes)).toBeTruthy();
  });

  it('starts the trail rather than reporting it missing', () => {
    const { getByText } = render(<Trail days={[]} timeZone={TZ} now={NOW} />);
    expect(getByText(EMPTY.trail)).toBeTruthy();
  });
});

describe('the ropes run the whole depth of the matrix', () => {
  it('carries them through a folded stretch: only the days fold, not the lanes', () => {
    const { container } = matrix(
      new Map([
        ['2027-07-08', { [FOCUS]: 1 }],
        ['2027-07-01', { [FOCUS]: 1 }],
      ]),
      [category(), category({ id: 'c-place', name: 'Place', icon: '📍', position: 1 })],
    );

    const quiet = container.querySelector('[data-quiet-row]')!;
    expect(quiet.querySelectorAll('.border-l')).toHaveLength(2);
  });
});

describe('a day in the Trail has the same two regions Home has', () => {
  const note = ripple({
    id: 'note',
    note: 'Condition Nienzo (2.0/5.0)',
    occurred_time: null,
    started_at: null,
    ended_at: null,
  });

  it('heads the section with a record that has no time, rather than crashing on it', () => {
    // A date-only record belongs to the day without a position on its axis
    // (SPEC 5.3). Drawn as a timeline row it has no clock to print, which is
    // what took the Locker down.
    const { getByText } = render(
      <InputSheetProvider>
        <Trail days={groupByDay([note], TZ)} timeZone={TZ} now={NOW} />
      </InputSheetProvider>,
    );

    expect(getByText('Condition Nienzo (2.0/5.0)')).toBeTruthy();
  });

  it('keeps the timed records on the axis below them', () => {
    const { container } = render(
      <InputSheetProvider>
        <Trail days={groupByDay([note, ripple({ id: 'timed' })], TZ)} timeZone={TZ} now={NOW} />
      </InputSheetProvider>,
    );

    // One row on the axis, not two: the note is not a row.
    expect(container.querySelectorAll('ol > li')).toHaveLength(1);
  });

  it('does not invite a new note here: the Trail reads, Home records', () => {
    const { queryByText } = render(
      <InputSheetProvider>
        <Trail days={groupByDay([note], TZ)} timeZone={TZ} now={NOW} />
      </InputSheetProvider>,
    );

    expect(queryByText('Add a Daily Note')).toBeNull();
  });
});
