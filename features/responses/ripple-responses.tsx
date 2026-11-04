'use client';

import { useState } from 'react';

import { usePeople } from '@/features/people/people-provider';

import { byThread, chipsOf, repliesShown, type RippleResponsesValue } from './model';
import { ReactionChips } from './reaction-chips';
import { ReplyAgain, ReplyField, ReplyList, type ReplyHandlers } from './reply-list';

/**
 * Where its replies are read and each Reply writes (H):
 * - `plain`: a record with no pool tabs — one run, the Reply on the
 *   reactions row opening the field under them all, a second Reply under
 *   the last (H75);
 * - `all`: my record's All tab — the Reply on the reactions row writes to
 *   me alone and opens above every run; mine to me alone first, under
 *   *Only me*, then each pool's run under "in Pancake", each ending in its
 *   own Reply that writes to that pool and opens there;
 * - `pool`: one pool's view (a tab, or the pool itself) — its replies only,
 *   never mine to me alone; with none yet, the Reply on the reactions row
 *   opens just below it, else that Reply is gone and the one under the
 *   last reply opens there. Both write to the pool.
 */
export type ResponsesMode =
  | { kind: 'plain' }
  | { kind: 'all'; owner: string; pools: Record<string, string> }
  | { kind: 'pool' };

/**
 * What readers left under one block (H25): its reaction chips — at the
 * row's right end whatever stands at its left — then its replies, every
 * one, none folded (H75). Nothing at all where nobody else can see the
 * ripple and nothing was left; a locked ripple takes none (0030).
 */
export function RippleResponses({
  rippleId,
  rippleAuthor,
  value,
  canRespond,
  onReact,
  on,
  mode = { kind: 'plain' },
}: {
  rippleId: string;
  rippleAuthor: string;
  value: RippleResponsesValue;
  canRespond: boolean;
  onReact: (emoji: string) => void;
  on: ReplyHandlers;
  mode?: ResponsesMode;
}) {
  const { me } = usePeople();
  // Which field is open: the top one, the foot of the run, or a pool's run (H).
  const [open, setOpen] = useState<string | null>(null);
  const chips = chipsOf(value.reactions, rippleId, me ?? '');
  const { shown } = repliesShown(value.replies, rippleId, true);
  if (!canRespond && chips.length === 0 && shown.length === 0) return null;

  const field = (key: string, pool?: string | null) =>
    canRespond && open === key ? (
      <ReplyField
        onSubmit={(body) => (pool === undefined ? on.reply(body) : on.reply(body, pool))}
        onCancel={() => setOpen(null)}
      />
    ) : null;
  const again = (key: string, pool?: string | null) =>
    canRespond && open !== key ? <ReplyAgain pool={pool} onClick={() => setOpen(key)} /> : null;

  // A pool's view with replies of its own: the Reply waits under the last one.
  const topReply = canRespond && !(mode.kind === 'pool' && shown.length > 0);

  return (
    <div data-ripple-responses={rippleId} className="flex flex-col gap-2 pt-2">
      <ReactionChips
        chips={chips}
        canReact={canRespond}
        onToggle={onReact}
        leading={
          topReply ? (
            <button
              type="button"
              data-reply-toggle={mode.kind === 'all' ? 'direct' : ''}
              aria-expanded={open === 'top'}
              onClick={() => setOpen(open === 'top' ? null : 'top')}
              className="text-pool-500 text-xs font-medium"
            >
              Reply
            </button>
          ) : null
        }
      />
      {mode.kind === 'all' ? (
        <>
          {/* To me alone: written above every run, and read first. */}
          {field('top', null)}
          {byThread({ reactions: [], replies: shown }, mode).map((group) =>
            group.key === '' ? (
              group.value.replies.length === 0 ? null : (
                <div key="direct" data-reply-group="direct" className="flex flex-col gap-2">
                  <ReplyList
                    replies={group.value.replies}
                    rippleAuthor={rippleAuthor}
                    on={on}
                    label="Only me"
                  />
                </div>
              )
            ) : (
              <div key={group.key} data-reply-group={group.key} className="flex flex-col gap-2">
                <ReplyList
                  replies={group.value.replies}
                  rippleAuthor={rippleAuthor}
                  on={on}
                  label={group.label}
                />
                {/* A pool's run takes its own Reply; a deleted pool's, none. */}
                {group.key === 'closed' ? null : (
                  <>
                    {again(group.key, group.key)}
                    {field(group.key, group.key)}
                  </>
                )}
              </div>
            ),
          )}
        </>
      ) : mode.kind === 'pool' ? (
        <>
          {field('top')}
          <ReplyList replies={shown} rippleAuthor={rippleAuthor} on={on} />
          {shown.length > 0 ? (
            <>
              {again('end')}
              {field('end')}
            </>
          ) : null}
        </>
      ) : (
        <>
          <ReplyList replies={shown} rippleAuthor={rippleAuthor} on={on} />
          {/* Opened from either Reply, at the foot of the run (H75). */}
          {field('top') ?? field('end')}
          {shown.length > 0 && open === null ? again('end') : null}
        </>
      )}
    </div>
  );
}
