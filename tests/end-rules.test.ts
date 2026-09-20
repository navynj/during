import { describe, expect, it } from 'vitest';

import { resolveEnd, strayMessage } from '@/features/ripple-sheet/end-rules';

const START = '2027-07-08T16:00:00.000Z';
const END = '2027-07-08T18:00:00.000Z';

describe('who may write an end (H17)', () => {
  it('leaves a running session without one: stopping writes that', () => {
    expect(
      resolveEnd(
        { started_at: START, ended_at: null },
        { occurredTime: '09:00', startInstant: START, endInstant: END },
      ),
    ).toBeNull();
  });

  it('corrects a finished one, because a past fact is correctable', () => {
    const corrected = '2027-07-08T17:30:00.000Z';
    expect(
      resolveEnd(
        { started_at: START, ended_at: END },
        { occurredTime: '09:00', startInstant: START, endInstant: corrected },
      ),
    ).toBe(corrected);
  });

  it('keeps the existing end when the edit does not mention one', () => {
    expect(
      resolveEnd(
        { started_at: START, ended_at: END },
        { occurredTime: '09:00', startInstant: START },
      ),
    ).toBe(END);
  });

  it('keeps a drop a point: its end follows its start (E2)', () => {
    const moved = '2027-07-08T20:00:00.000Z';
    expect(
      resolveEnd(
        { started_at: START, ended_at: START },
        { occurredTime: '13:00', startInstant: moved, endInstant: END },
      ),
    ).toBe(moved);
  });

  it('drops the end entirely when the record becomes all-day', () => {
    expect(
      resolveEnd(
        { started_at: START, ended_at: END },
        { occurredTime: null, startInstant: null, endInstant: END },
      ),
    ).toBeNull();
  });
});

describe('naming what is in the way', () => {
  it('calls an unnoted span a break, since that is what one is (H15a2)', () => {
    expect(
      strayMessage({ note: null, started_at: START, ended_at: END, occurred_time: '09:20:00' }),
    ).toBe('That span leaves the break at 09:20 outside this session.');
  });

  it('uses a note when the record has one', () => {
    expect(
      strayMessage({
        note: 'parannoul on repeat',
        started_at: START,
        ended_at: END,
        occurred_time: '09:40:00',
      }),
    ).toBe('That span leaves parannoul on repeat at 09:40 outside this session.');
  });

  it('calls a point a record, not a break', () => {
    expect(
      strayMessage({ note: null, started_at: START, ended_at: START, occurred_time: '09:40:00' }),
    ).toBe('That span leaves the record at 09:40 outside this session.');
  });
});
