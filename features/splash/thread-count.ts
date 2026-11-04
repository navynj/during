/**
 * What a pool's tab counts on my record (H75): what others left in that
 * pool — their ripples written there and their replies there. Mine are not
 * news to me; a reply from no pool is mine, the owner's, by its rule (0053).
 */
export function threadCount(
  poolId: string,
  me: string,
  ripples: { author_id: string | null; thread_pool_id: string | null }[],
  replies: { author_id: string; thread_pool_id: string | null }[],
): number {
  const theirs = (row: { author_id: string | null; thread_pool_id: string | null }): boolean =>
    row.thread_pool_id === poolId && row.author_id !== null && row.author_id !== me;
  return ripples.filter(theirs).length + replies.filter(theirs).length;
}
