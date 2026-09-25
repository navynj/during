// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/now',
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));

import { FocusScreen } from '@/features/focus/focus-screen';
import { InputSheet, type SheetContext } from '@/features/input-sheet/input-sheet';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { wallClockToInstant } from '@/lib/ripple-kind';

const TZ = 'America/Vancouver';

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

const session: RippleWithCategory = {
  id: 'sess',
  author_id: 'a1',
  category_id: 'c1',
  note: 'During Implement',
  media: [],
  occurred_on: '2026-09-19',
  occurred_time: '09:00:00',
  ended_at: null,
  planned: false,
  participants: [],
  created_at: '2026-09-19T16:00:00.000Z',
  parent_ripple_id: null,
  splash_id: null,
  started_at: wallClockToInstant('2026-09-19', '09:00', TZ).toISOString(),
  category: { name: 'Focus', icon: '🔍' },
};

const context: SheetContext = {
  categories: [
    {
      id: 'c1',
      user_id: 'a1',
      name: 'Focus',
      icon: '🔍',
      default_mode: 'timed',
      position: 0,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'c2',
      user_id: 'a1',
      name: 'Listening',
      icon: '🎧',
      default_mode: 'drop',
      position: 1,
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  ripples: [session],
  running: session,
  timeZone: TZ,
  date: '2026-09-19',
};

function innerSheet() {
  return render(
    <InputSheet
      context={context}
      prefill={{ parentRippleId: 'sess' }}
      onClose={() => {}}
      onCommitted={() => {}}
    />,
  );
}

describe('inner mode', () => {
  it('names the parent in the grammar of the now band', () => {
    const { container } = innerSheet();
    const band = container.querySelector('[data-parent-band]') as HTMLElement;

    // Inside the blue is inside the session, literally.
    expect(band).not.toBeNull();
    expect(band.className).toContain('live-surface');
    expect(band.textContent).toBe('Into Focus · During Implement');
  });

  it('commits with a label that says where it goes', () => {
    const { getByText } = innerSheet();
    expect(getByText('Drop into session')).toBeTruthy();
  });

  it('hides All day: a child has to lie inside its parent span', () => {
    const inner = innerSheet();
    expect(inner.queryByText('All day')).toBeNull();

    cleanup();
    const ordinary = render(
      <InputSheet context={context} prefill={{}} onClose={() => {}} onCommitted={() => {}} />,
    );
    expect(ordinary.getByText('All day')).toBeTruthy();
  });

  it('hides the Timer: timed children exist today only as Breaks', () => {
    const { getByLabelText } = innerSheet();
    expect(getByLabelText('Start a timer').hidden).toBe(true);
  });

  it('leaves the Timer available on an ordinary draft', () => {
    const { getByLabelText } = render(
      <InputSheet context={context} prefill={{}} onClose={() => {}} onCommitted={() => {}} />,
    );
    expect(getByLabelText('Start a timer').hidden).toBe(false);
  });
});

describe('the sheet over the live surface', () => {
  it('leaves the focus screen mounted behind it', () => {
    const { container, getByLabelText, rerender } = render(
      <FocusScreen
        ripple={session}
        startedAt={session.started_at!}
        initialSeconds={60}
        sheetContext={context}
      />,
    );

    getByLabelText('Add to this session').click();
    rerender(
      <FocusScreen
        ripple={session}
        startedAt={session.started_at!}
        initialSeconds={60}
        sheetContext={context}
      />,
    );

    // The surface is a sibling of the sheet, not a page that was left.
    expect(container.querySelector('.live-surface')).not.toBeNull();
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
