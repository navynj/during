import { describe, expect, it } from 'vitest';

import { fallbackLane } from '@/features/pool/audience';
import {
  followHomeLane,
  NO_SHARE,
  shareLane,
  shareOff,
  shareOn,
} from '@/features/pool/share-draft';

// Two pools: Crew has a Food lane, Church has none.
const pools = [
  {
    id: 'crew',
    lanes: [
      { id: 'crew-day', name: 'Day' },
      { id: 'crew-food', name: 'Food' },
    ],
  },
  {
    id: 'church',
    lanes: [
      { id: 'church-day', name: 'Day' },
      { id: 'church-prayer', name: 'Prayer' },
    ],
  },
];
const laneOf = (draft: typeof NO_SHARE, poolId: string): string | undefined =>
  draft.picks.find((p) => p.poolId === poolId)?.poolLaneId;

describe('Share to lanes while writing (H75)', () => {
  it('an auto lane follows a same-named Home lane', () => {
    const on = shareOn(NO_SHARE, 'crew', 'crew-day');
    expect(laneOf(followHomeLane(on, 'Food', pools), 'crew')).toBe('crew-food');
    // Case and edge spaces aside.
    expect(laneOf(followHomeLane(on, ' food ', pools), 'crew')).toBe('crew-food');
  });

  it('an auto lane stays put when the pool has no lane of that name, never back to its first', () => {
    const on = shareOn(NO_SHARE, 'church', 'church-prayer');
    expect(laneOf(followHomeLane(on, 'Food', pools), 'church')).toBe('church-prayer');
    expect(laneOf(followHomeLane(on, null, pools), 'church')).toBe('church-prayer');
  });

  it('a manual lane never changes with the Home lane', () => {
    const picked = shareLane(shareOn(NO_SHARE, 'crew', 'crew-food'), 'crew', 'crew-day');
    expect(picked.manual).toEqual(['crew']);
    expect(laneOf(followHomeLane(picked, 'Food', pools), 'crew')).toBe('crew-day');
    // Others still follow.
    const both = shareOn(picked, 'church', 'church-prayer');
    const moved = followHomeLane(both, 'Day', pools);
    expect(laneOf(moved, 'crew')).toBe('crew-day');
    expect(laneOf(moved, 'church')).toBe('church-day');
  });

  it('turning a pool off and on again resets it to auto', () => {
    const picked = shareLane(shareOn(NO_SHARE, 'crew', 'crew-day'), 'crew', 'crew-day');
    const off = shareOff(picked, 'crew');
    expect(off).toEqual({ picks: [], manual: [] });
    const again = shareOn(off, 'crew', 'crew-day');
    expect(again.manual).toEqual([]);
    expect(laneOf(followHomeLane(again, 'Food', pools), 'crew')).toBe('crew-food');
  });

  it('closed and opened again, the draft starts empty and a pool turned on is auto again', () => {
    const picked = shareLane(shareOn(NO_SHARE, 'crew', 'crew-day'), 'crew', 'crew-food');
    expect(picked.manual).toEqual(['crew']);
    // Closing drops the draft; the sheet opens on an empty one.
    const reopened = NO_SHARE;
    expect(reopened).toEqual({ picks: [], manual: [] });
    // Turned on, it starts from my Home lane's namesake, never the lane picked before.
    const on = shareOn(reopened, 'crew', fallbackLane('Day', pools[0].lanes)!);
    expect(laneOf(on, 'crew')).toBe('crew-day');
    expect(on.manual).toEqual([]);
    // Auto: it follows the Home lane again.
    expect(laneOf(followHomeLane(on, 'Food', pools), 'crew')).toBe('crew-food');
  });
});
