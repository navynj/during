'use client';

import { useState } from 'react';

import { usePeople } from '@/features/people/people-provider';

import { chipsOf, repliesShown, type RippleResponsesValue } from './model';
import { ReactionChips } from './reaction-chips';
import { ReplyList, type ReplyHandlers } from './reply-list';

/**
 * What readers left under one block (H25): its reaction chips, then its
 * replies. The reply field is not always open: "Reply" at the left end of
 * the reactions row, its chips at the right end, opens it, with Cancel and Save (Yoonji, in the
 * session). Every reply shows, none folded behind "+n more": the splash is
 * where a conversation is read in full; the card stack keeps its own short
 * view (H75). Nothing at all where nobody else can see the ripple and
 * nothing was left; a locked ripple takes none (0030).
 */
export function RippleResponses({
  rippleId,
  rippleAuthor,
  value,
  canRespond,
  onReact,
  on,
}: {
  rippleId: string;
  rippleAuthor: string;
  value: RippleResponsesValue;
  canRespond: boolean;
  onReact: (emoji: string) => void;
  on: ReplyHandlers;
}) {
  const { me } = usePeople();
  const [composing, setComposing] = useState(false);
  const chips = chipsOf(value.reactions, rippleId, me ?? '');
  const { shown } = repliesShown(value.replies, rippleId, true);
  if (!canRespond && chips.length === 0 && shown.length === 0) return null;
  return (
    <div data-ripple-responses={rippleId} className="flex flex-col gap-2 pt-2">
      <ReactionChips
        chips={chips}
        canReact={canRespond}
        onToggle={onReact}
        leading={
          canRespond ? (
            <button
              type="button"
              data-reply-toggle
              aria-expanded={composing}
              onClick={() => setComposing((open) => !open)}
              className="text-pool-500 text-xs font-medium"
            >
              Reply
            </button>
          ) : null
        }
      />
      <ReplyList
        replies={shown}
        rippleAuthor={rippleAuthor}
        canReply={canRespond}
        on={on}
        composing={composing}
        onDoneComposing={() => setComposing(false)}
        onCompose={() => setComposing(true)}
      />
    </div>
  );
}
