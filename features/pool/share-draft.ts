import { sameNamedLane, withPick, type AudiencePick } from './audience';

/**
 * Where a record being written is shared (H75): a pick per pool turned on,
 * and which of those lanes were chosen by hand. A lane the composer gave
 * (`auto`) follows the Home lane to a same-named pool lane; one picked in
 * the pool's lane picker (`manual`) stays for the rest of the draft. The
 * source lives only here, never in a row.
 */
export type ShareDraft = { picks: AudiencePick[]; manual: string[] };

export const NO_SHARE: ShareDraft = { picks: [], manual: [] };

/** A pool turned on, on the lane it starts on: auto, even if it was manual before. */
export function shareOn(draft: ShareDraft, poolId: string, laneId: string): ShareDraft {
  return {
    picks: withPick(draft.picks, poolId, laneId),
    manual: draft.manual.filter((id) => id !== poolId),
  };
}

/** A pool turned off: its pick and its source go with it. */
export function shareOff(draft: ShareDraft, poolId: string): ShareDraft {
  return {
    picks: withPick(draft.picks, poolId, null),
    manual: draft.manual.filter((id) => id !== poolId),
  };
}

/** A lane picked by hand in the pool's lane picker: manual from now on. */
export function shareLane(draft: ShareDraft, poolId: string, laneId: string): ShareDraft {
  return {
    picks: withPick(draft.picks, poolId, laneId),
    manual: draft.manual.includes(poolId) ? draft.manual : [...draft.manual, poolId],
  };
}

/**
 * The Home lane changed: every auto pool moves to its lane of the same
 * name, and one without such a lane keeps the lane it has — never back to
 * its first. Manual pools do not move.
 */
export function followHomeLane(
  draft: ShareDraft,
  homeLaneName: string | null,
  pools: { id: string; lanes: { id: string; name: string }[] }[],
): ShareDraft {
  let picks = draft.picks;
  for (const pick of draft.picks) {
    if (draft.manual.includes(pick.poolId)) continue;
    const lanes = pools.find((p) => p.id === pick.poolId)?.lanes ?? [];
    const same = sameNamedLane(homeLaneName, lanes);
    if (same && same !== pick.poolLaneId) picks = withPick(picks, pick.poolId, same);
  }
  return picks === draft.picks ? draft : { ...draft, picks };
}
