import { describe, expect, it } from 'vitest';

import { threadCount } from '@/features/splash/thread-count';

const ME = 'u-me';
const row = (author_id: string | null, thread_pool_id: string | null) => ({
  author_id,
  thread_pool_id,
});

describe('a pool tab’s count on my record (H75)', () => {
  it('counts others’ ripples and replies in that pool', () => {
    const ripples = [row('u-mina', 'p'), row('u-jae', 'q')];
    const replies = [row('u-mina', 'p'), row('u-jae', 'p')] as {
      author_id: string;
      thread_pool_id: string | null;
    }[];
    expect(threadCount('p', ME, ripples, replies)).toBe(3);
    expect(threadCount('q', ME, ripples, replies)).toBe(1);
  });

  it('counts replies alone: a splash with only replies is not zero', () => {
    const replies = [{ author_id: 'u-mina', thread_pool_id: 'p' }];
    expect(threadCount('p', ME, [], replies)).toBe(1);
  });

  it('leaves out mine, a removed part, and what was said from no pool', () => {
    const ripples = [row(ME, 'p'), row(null, 'p')];
    const replies = [
      { author_id: ME, thread_pool_id: 'p' },
      { author_id: 'u-mina', thread_pool_id: null },
    ];
    expect(threadCount('p', ME, ripples, replies)).toBe(0);
  });
});
