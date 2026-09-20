// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/media', () => ({ signRippleMedia: () => Promise.resolve([]) }));
vi.mock('@/features/ripple-sheet/actions', () => ({ deleteRipple: () => Promise.resolve() }));

import { DetailSheet } from '@/features/ripple-sheet/detail-sheet';
import type { RippleWithCategory } from '@/lib/queries/ripples';

const TZ = 'America/Vancouver';

afterEach(cleanup);

function ripple(over: Partial<RippleWithCategory> = {}): RippleWithCategory {
  return {
    id: 'sess',
    author_id: 'a1',
    category_id: 'c1',
    note: 'During Implement',
    media: [],
    occurred_on: '2026-09-19',
    occurred_time: '09:00:00',
    started_at: '2026-09-19T16:00:00.000Z',
    ended_at: '2026-09-19T18:00:00.000Z',
    planned: false,
    participants: [],
    created_at: '2026-09-19T16:00:00.000Z',
    parent_ripple_id: null,
    category: { name: 'Focus', icon: '🔍' },
    ...over,
  };
}

const inner: RippleWithCategory[] = [
  ripple({
    id: 'inner-1',
    parent_ripple_id: 'sess',
    note: 'call from the bank',
    occurred_time: '09:30:00',
    started_at: null,
    ended_at: null,
  }),
];

function sheet(props: Partial<Parameters<typeof DetailSheet>[0]> = {}) {
  return render(
    <DetailSheet
      ripple={ripple()}
      inner={inner}
      locked={false}
      timeZone={TZ}
      onClose={() => {}}
      onEdit={() => {}}
      {...props}
    />,
  );
}

describe('a record inside a session is still a record', () => {
  it('opens its own sheet when its row is tapped', () => {
    const opened: string[] = [];
    const { getByText } = sheet({ onOpenInner: (id) => opened.push(id) });

    fireEvent.click(getByText('call from the bank').closest('button') as HTMLButtonElement);

    expect(opened).toEqual(['inner-1']);
  });

  it('offers the way in from a session that has already finished', () => {
    const added: number[] = [];
    const { getByText } = sheet({ onAddInner: () => added.push(1) });

    fireEvent.click(getByText('+ Add to this session'));

    expect(added).toHaveLength(1);
  });

  it('has no way in on a drop, which has no span to sit inside', () => {
    const { queryByText } = sheet({
      // A drop ends where it starts, which is what makes it a drop.
      ripple: ripple({ ended_at: '2026-09-19T16:00:00.000Z' }),
      inner: [],
      onAddInner: () => {},
    });

    expect(queryByText('+ Add to this session')).toBeNull();
  });

  it('warns that deleting the session takes what is inside it with it', () => {
    const { getByText } = sheet();

    fireEvent.click(getByText('Delete'));

    expect(getByText('Deletes this session and 1 record inside it')).toBeTruthy();
  });
});
