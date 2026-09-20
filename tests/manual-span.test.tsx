// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));

const commits: unknown[] = [];
vi.mock('@/features/input-sheet/commit', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  commitRipple: (draft: unknown) => {
    commits.push(draft);
    return Promise.resolve({ ok: true, rippleId: 'new' });
  },
  stopSession: () => Promise.resolve({ ok: true, rippleId: 'r' }),
}));
vi.mock('@/features/ripple-sheet/actions', () => ({
  updateRipple: (edit: unknown) => {
    commits.push(edit);
    return Promise.resolve({ ok: true, rippleId: 'r' });
  },
}));
vi.mock('@/lib/media', () => ({
  signRippleMedia: () => Promise.resolve([]),
  uploadRippleMedia: () => Promise.resolve([]),
}));

import { InputSheet, type SheetContext } from '@/features/input-sheet/input-sheet';
import { MiniAxis } from '@/features/input-sheet/mini-axis';
import type { Draft } from '@/features/input-sheet/draft';
import type { RippleWithCategory } from '@/lib/queries/ripples';

const TZ = 'America/Vancouver';
const DAY = '2027-07-08';

/** Vancouver is UTC-7 in July, so 09:00 local is 16:00Z. */
function utc(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2027, 6, 8, h + 7, m)).toISOString();
}

beforeEach(() => {
  commits.length = 0;
  // Noon in Vancouver: the sheet's "now", so past and future are decidable.
  vi.setSystemTime(new Date(utc('12:00')));
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
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const context: SheetContext = {
  categories: [
    {
      id: 'c1',
      user_id: 'a1',
      name: 'Focus',
      icon: '🔍',
      default_mode: 'timed',
      position: 0,
      created_at: '2027-01-01T00:00:00Z',
    },
  ],
  ripples: [],
  running: null,
  timeZone: TZ,
  date: DAY,
};

function sheet(over: Partial<Parameters<typeof InputSheet>[0]> = {}) {
  return render(
    <InputSheet
      context={context}
      prefill={{}}
      onClose={() => {}}
      onCommitted={() => {}}
      {...over}
    />,
  );
}

/** Types a start and an end into the control, the way a thumb would. */
function setSpan(view: ReturnType<typeof render>, start: string, end: string) {
  const label = view.container.querySelector('[data-time-label]')!.closest('button')!;
  fireEvent.click(label);
  fireEvent.change(view.getByLabelText('Time'), { target: { value: start } });
  fireEvent.blur(view.getByLabelText('Time'));
  fireEvent.click(view.getByText('+ end'));
  fireEvent.change(view.getByLabelText('End time'), { target: { value: end } });
}

describe('the end is asked for, not offered as a field', () => {
  it('starts without one: the default record is a point', () => {
    const view = sheet();
    expect(view.queryByLabelText('End time')).toBeNull();
    expect(view.getByText('+ end')).toBeTruthy();
  });

  it('shows the duration its two times imply, never an input for it', () => {
    const view = sheet();
    setSpan(view, '09:00', '10:30');

    expect(view.container.querySelector('[data-derived-duration]')!.textContent).toBe('1h 30m');
  });

  it('has no end to offer on an all-day record', () => {
    const view = sheet({ prefill: { allDay: true } });
    expect(view.queryByText('+ end')).toBeNull();
  });

  it('commits a past span as Drop, because Drop means set this down', () => {
    const view = sheet();
    setSpan(view, '09:00', '10:30');
    fireEvent.click(view.getByText('Drop'));

    expect(commits).toHaveLength(1);
    const draft = commits[0] as { mode: string; endInstant: string; planned: boolean };
    expect(draft.mode).toBe('drop');
    expect(draft.endInstant).toBe(utc('10:30'));
    expect(draft.planned).toBe(false);
  });

  it('commits a future span as a plan, like any other future record', () => {
    const view = sheet();
    setSpan(view, '14:00', '16:00');
    fireEvent.click(view.getByText('Save as plan'));

    const draft = commits[0] as { planned: boolean; endInstant: string };
    expect(draft.planned).toBe(true);
    expect(draft.endInstant).toBe(utc('16:00'));
  });

  it('puts the Timer away once an end is typed: that record is finished', () => {
    const view = sheet();
    setSpan(view, '09:00', '10:30');

    expect((view.getByLabelText('Start a timer') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('the present is written by the Timer', () => {
  it('refuses a span that has not finished, and offers to let it run', () => {
    const view = sheet();
    setSpan(view, '11:00', '13:00');
    fireEvent.click(view.getByText('Drop'));

    expect(commits).toHaveLength(0);
    expect(view.getByText('That end hasn’t happened yet.')).toBeTruthy();
    expect(view.getByText('Start it running from 11:00 instead')).toBeTruthy();
  });

  it('keeps the start and drops the end when the offer is taken', () => {
    const view = sheet();
    setSpan(view, '11:00', '13:00');
    fireEvent.click(view.getByText('Drop'));
    fireEvent.click(view.getByText('Start it running from 11:00 instead'));

    const draft = commits[0] as { mode: string; occurredTime: string; endInstant: string | null };
    expect(draft.mode).toBe('timer');
    expect(draft.occurredTime).toBe('11:00');
    expect(draft.endInstant).toBeNull();
  });

  it('offers no timer inside a session, where there is none to start', () => {
    const parent: RippleWithCategory = {
      id: 'sess',
      author_id: 'a1',
      category_id: 'c1',
      note: 'During Implement',
      media: [],
      occurred_on: DAY,
      occurred_time: '09:00:00',
      started_at: utc('09:00'),
      ended_at: null,
      planned: false,
      participants: [],
      created_at: utc('09:00'),
      parent_ripple_id: null,
      category: { name: 'Focus', icon: '🔍' },
    };
    const view = sheet({
      context: { ...context, ripples: [parent], running: parent },
      prefill: { parentRippleId: 'sess' },
    });

    setSpan(view, '11:00', '13:00');
    fireEvent.click(view.getByText('Drop into session'));

    expect(view.getByText('Give it an end that has already passed, or clear it.')).toBeTruthy();
    expect(view.queryByText(/Start it running/)).toBeNull();
  });
});

describe('the ghost shows the kind the record will have', () => {
  function ghostOf(draft: Partial<Draft>) {
    const { container } = render(
      <MiniAxis
        ripples={[]}
        draft={{
          categoryId: 'c1',
          note: '',
          time: '09:00',
          audience: 'everyone',
          media: [],
          endTime: null,
          ...draft,
        }}
        emoji={null}
        timeZone={TZ}
        date={DAY}
      />,
    );
    return container.querySelector('[data-ghost]')!;
  }

  it('is one line while the draft is a point', () => {
    expect(ghostOf({}).querySelectorAll('path')).toHaveLength(1);
  });

  it('becomes a bundle spanning the end that was typed', () => {
    // Log-scaled, so this asserts more than one line rather than a count.
    expect(ghostOf({ endTime: '11:00' }).querySelectorAll('path').length).toBeGreaterThan(1);
  });
});

describe('the same field, correcting instead of composing', () => {
  function record(over: Partial<RippleWithCategory> = {}): RippleWithCategory {
    return {
      id: 'r1',
      author_id: 'a1',
      category_id: 'c1',
      note: 'the meeting',
      media: [],
      occurred_on: DAY,
      occurred_time: '09:00:00',
      started_at: utc('09:00'),
      ended_at: utc('09:00'),
      planned: false,
      participants: [],
      created_at: utc('09:00'),
      parent_ripple_id: null,
      category: { name: 'Focus', icon: '🔍' },
      ...over,
    };
  }

  function editing(ripple: RippleWithCategory) {
    return sheet({ editing: { ripple, locked: false } });
  }

  it('promotes a drop to timed when an end is added', () => {
    const view = editing(record());

    fireEvent.click(view.getByText('+ end'));
    fireEvent.change(view.getByLabelText('End time'), { target: { value: '10:00' } });
    fireEvent.click(view.getByText('Update'));

    expect((commits[0] as { endInstant: string }).endInstant).toBe(utc('10:00'));
  });

  it('demotes a span to a drop when its end is cleared', () => {
    const view = editing(record({ ended_at: utc('11:00') }));

    expect(view.getByLabelText('End time')).toBeTruthy();
    fireEvent.click(view.getByLabelText('Remove the end'));
    fireEvent.click(view.getByText('Update'));

    // Null, not a shorter end: the record stops claiming a duration at all.
    expect((commits[0] as { endInstant: string | null }).endInstant).toBeNull();
  });

  it('leaves a running session alone: stopping still writes that end', () => {
    const view = editing(record({ ended_at: null }));

    expect(view.queryByText('+ end')).toBeNull();
    expect(view.queryByLabelText('End time')).toBeNull();
  });

  it('refuses to correct an end into the present', () => {
    const view = editing(record({ ended_at: utc('11:00') }));

    fireEvent.change(view.getByLabelText('End time'), { target: { value: '13:00' } });
    fireEvent.click(view.getByText('Update'));

    expect(commits).toHaveLength(0);
    expect(view.getByText('Give it an end that has already passed, or clear it.')).toBeTruthy();
  });
});

describe('what "+ end" proposes', () => {
  it('holds back to now, so the first tap lands on a span that has finished', () => {
    const view = sheet();
    const label = view.container.querySelector('[data-time-label]')!.closest('button')!;
    fireEvent.click(label);
    fireEvent.change(view.getByLabelText('Time'), { target: { value: '11:30' } });
    fireEvent.blur(view.getByLabelText('Time'));
    fireEvent.click(view.getByText('+ end'));

    // Now is 12:00, so an hour would have run into the present.
    expect((view.getByLabelText('End time') as HTMLInputElement).value).toBe('12:00');
  });

  it('gives a future start its whole hour', () => {
    const view = sheet();
    const label = view.container.querySelector('[data-time-label]')!.closest('button')!;
    fireEvent.click(label);
    fireEvent.change(view.getByLabelText('Time'), { target: { value: '14:00' } });
    fireEvent.blur(view.getByLabelText('Time'));
    fireEvent.click(view.getByText('+ end'));

    expect((view.getByLabelText('End time') as HTMLInputElement).value).toBe('15:00');
  });
});
