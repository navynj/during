// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Card } from '@/features/home/grid';
import { PostRow } from '@/features/home/post-row';

afterEach(cleanup);

/** The fields a List row reads, and nothing else. */
function row(over: Partial<Card> = {}): Card {
  return {
    splash: { id: 's1', title: 'Hoppers', ghostTitle: null, icon: null },
    ...over,
  } as unknown as Card;
}

const draw = (card: Card) =>
  render(<PostRow card={card} lane={null} current ring={null} onPick={() => {}} />);

describe('a List row says where a record is shared, and nothing when it is not (H78)', () => {
  it('draws no marker for Only me: private is the default', () => {
    const { container } = draw(row());
    expect(container.querySelector('[data-row-pool]')).toBeNull();
    expect(container.querySelector('[data-only-me]')).toBeNull();
    expect(container.querySelector('svg.lucide-lock')).toBeNull();
  });

  it('names every pool my record is shared to', () => {
    const { container } = draw(
      row({
        sharedPools: [
          { name: 'Pancake', photo: null },
          { name: 'Crew', photo: null },
        ],
      }),
    );
    expect(container.querySelectorAll('[data-row-pool]')).toHaveLength(2);
  });

  it('names a pool’s own record by its pool', () => {
    const { container } = draw(row({ pools: ['Pancake'], poolPhoto: null }));
    expect(container.querySelectorAll('[data-row-pool]')).toHaveLength(1);
  });
});
