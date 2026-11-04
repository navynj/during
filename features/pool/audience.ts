/**
 * A record's audience (H23, 0033, H45): where it is shared, pool by pool,
 * each on one of that pool's lanes, set record by record. Ripples have none
 * of their own; they follow their record. A Home record starts "Only me".
 * The shape leaves room for a Followers row later.
 */

/** Who my record is with in one pool (0035): Everyone, or faces picked. */
export type PickTogether = { everyone: boolean; picked: string[] };

/** One pool a record is shared to, on which of its lanes, and with whom there. */
export type AudiencePick = { poolId: string; poolLaneId: string; together?: PickTogether };

/** Nobody picked, Everyone off: the default With (0035). */
export const NOBODY: PickTogether = { everyone: false, picked: [] };

/** "Only me", the pool's name, or "N pools". */
export function audienceLabel(poolNames: string[]): string {
  if (poolNames.length === 0) return 'Only me';
  if (poolNames.length === 1) return poolNames[0];
  return `${poolNames.length} pools`;
}

/**
 * The pool lane a pool starts on when it is turned on — in the composer's
 * Share to row and in every Audience sheet (H75, revising H45(b)): sharing
 * is never held up by a lane. The one I last picked for it on this device;
 * else the pool lane named as my lane; else the pool's first. It only fills
 * the lane once I turn a pool on; it never turns sharing on by itself.
 * None only when the pool has no lanes at all.
 */
export function fallbackLane(
  lastPicked: string | null,
  myLaneName: string | null,
  poolLanes: { id: string; name: string }[],
): string | null {
  if (lastPicked && poolLanes.some((l) => l.id === lastPicked)) return lastPicked;
  return sameNamedLane(myLaneName, poolLanes) ?? poolLanes[0]?.id ?? null;
}

/** The pool lane named as my lane, case and edge spaces aside; none without one. */
export function sameNamedLane(
  myLaneName: string | null,
  poolLanes: { id: string; name: string }[],
): string | null {
  const named = myLaneName?.trim().toLowerCase();
  if (!named) return null;
  return poolLanes.find((l) => l.name.trim().toLowerCase() === named)?.id ?? null;
}

/** The audience with one pool switched: on a pool lane, or off (null). */
export function withPick(
  audience: AudiencePick[],
  poolId: string,
  poolLaneId: string | null,
): AudiencePick[] {
  const was = audience.find((a) => a.poolId === poolId);
  const rest = audience.filter((a) => a.poolId !== poolId);
  return poolLaneId
    ? [...rest, { poolId, poolLaneId, ...(was?.together ? { together: was.together } : {}) }]
    : rest;
}

/** The audience with one pool's With set (0035). */
export function withTogether(
  audience: AudiencePick[],
  poolId: string,
  together: PickTogether,
): AudiencePick[] {
  return audience.map((a) => (a.poolId === poolId ? { ...a, together } : a));
}

/** Whether a pick's With names anyone (Everyone, or a face). */
export function invitesAnyone(together: PickTogether | undefined): boolean {
  return Boolean(together && (together.everyone || together.picked.length > 0));
}
