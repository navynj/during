'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

import { Avatar, PersonName } from '@/features/people/avatar';
import { usePeople } from '@/features/people/people-provider';

import { relativeTime, type ReplyRow } from './model';
import { ReplyInput } from './reply-input';
import { ThreadLabel } from './thread-label';
import { LinkedText } from '@/components/ui/linked-text';

/** A reply's face: small, beside its words. */
const FACE_PX = 16;

export type ReplyHandlers = {
  reply: (body: string) => void;
  edit: (id: string, body: string) => void;
  remove: (id: string) => void;
  hide: (id: string, hidden: boolean) => void;
};

/**
 * A block's replies (H25), every one, oldest first (H75); each its author's face, name, age and text — "edited" once
 * edited, "Hidden by the author" once hidden. Mine I edit and delete; on my
 * ripple I hide anyone's. The one-line input opens from the reactions
 * row's "Reply" (Yoonji, in the session), at the bottom, with Cancel and
 * Save, and grows to four lines. Under the last reply, a second
 * "Reply" sits at the replies' indent, opening the same input in the same
 * place (H75). Opened from the
 * top, the input is scrolled into view. With `labelOf` (the All tab), a run
 * of replies from one pool sits under one "in Pancake" (H75).
 */
export function ReplyList({
  replies,
  rippleAuthor,
  canReply,
  on,
  composing = false,
  onDoneComposing = () => {},
  onCompose,
  labelOf,
}: {
  replies: ReplyRow[];
  rippleAuthor: string;
  canReply: boolean;
  on: ReplyHandlers;
  /** The reply field is open, asked for by the reactions row's "Reply". */
  composing?: boolean;
  onDoneComposing?: () => void;
  /** Opens the reply field from under the last reply (H75); absent, no second Reply. */
  onCompose?: () => void;
  /** Where a reply was written, "in Pancake", or none; absent, no labels. */
  labelOf?: (poolId: string | null) => string | null;
}) {
  const { me } = usePeople();
  const [editing, setEditing] = useState<string | null>(null);
  const field = useRef<HTMLDivElement>(null);
  // Where the new reply will appear, brought into view as it opens.
  useEffect(() => {
    if (composing) field.current?.scrollIntoView?.({ block: 'nearest' });
  }, [composing]);
  if (replies.length === 0 && !(canReply && composing)) return null;
  return (
    <div data-replies className="flex flex-col gap-2">
      {replies.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {replies.map((reply, at) => {
            const label = labelOf?.(reply.thread_pool_id) ?? null;
            // Once per run: a reply from the same pool as the one above takes none.
            const heads =
              label !== null &&
              (at === 0 || replies[at - 1].thread_pool_id !== reply.thread_pool_id);
            return (
              <Fragment key={reply.id}>
                {heads ? (
                  <li
                    data-reply-thread-label
                    style={{ marginLeft: FACE_PX + 8 }}
                    className="-mb-1.5"
                  >
                    <ThreadLabel>{label}</ThreadLabel>
                  </li>
                ) : null}
                <li
                  id={`reply-${reply.id}`}
                  data-reply={reply.id}
                  data-hidden={reply.hidden ? '' : undefined}
                  className="grid gap-x-2"
                  style={{ gridTemplateColumns: `${FACE_PX}px minmax(0, 1fr)` }}
                >
                  <Avatar
                    id={reply.author_id}
                    initials=""
                    className="bg-pool-100 text-pool-500 mt-0.5 flex items-center justify-center rounded-full text-[10px]"
                    style={{ width: FACE_PX, height: FACE_PX }}
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-pool-500 flex flex-wrap items-baseline gap-x-1 text-[11px]">
                      <span className="text-ink font-medium">
                        <PersonName id={reply.author_id} name="Someone" />
                      </span>
                      <span>· {relativeTime(reply.created_at)}</span>
                      {reply.edited_at ? <span data-reply-edited>· edited</span> : null}
                      {reply.former ? <span data-reply-former>· Former member</span> : null}
                    </p>
                    {editing === reply.id ? (
                      <ReplyInput
                        initial={reply.body ?? ''}
                        label="Edit reply"
                        onSubmit={(body) => {
                          setEditing(null);
                          on.edit(reply.id, body);
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    ) : reply.body === null ? (
                      <p className="text-pool-500 text-sm italic">Hidden by the author</p>
                    ) : (
                      <p className="text-ink text-sm break-words whitespace-pre-wrap">
                        <LinkedText text={reply.body} />
                      </p>
                    )}
                    {reply.hidden && reply.body !== null ? (
                      <p className="text-pool-500 text-[11px] italic">Hidden by the author</p>
                    ) : null}
                    <ReplyActions
                      reply={reply}
                      mine={reply.author_id === me}
                      onMyRipple={rippleAuthor === me && reply.author_id !== me}
                      editing={editing === reply.id}
                      onEdit={() => setEditing(reply.id)}
                      on={on}
                    />
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ol>
      ) : null}
      {canReply && composing ? (
        <div ref={field} data-reply-field>
          <ReplyInput
            label="Reply"
            autoFocus
            onSubmit={(body) => {
              on.reply(body);
              onDoneComposing();
            }}
            onCancel={onDoneComposing}
          />
        </div>
      ) : canReply && onCompose && replies.length > 0 ? (
        // Read to the end, answered from there (H75): the replies' own indent.
        <button
          type="button"
          data-reply-again
          onClick={onCompose}
          className="text-pool-500 self-start text-xs font-medium"
          style={{ marginLeft: FACE_PX + 8 }}
        >
          Reply
        </button>
      ) : null}
    </div>
  );
}

function ReplyActions({
  reply,
  mine,
  onMyRipple,
  editing,
  onEdit,
  on,
}: {
  reply: ReplyRow;
  mine: boolean;
  onMyRipple: boolean;
  editing: boolean;
  onEdit: () => void;
  on: ReplyHandlers;
}) {
  if (editing || (!mine && !onMyRipple)) return null;
  const action = 'text-pool-500 text-[11px] font-medium';
  return (
    <span className="flex gap-3">
      {mine && !reply.hidden ? (
        <button type="button" data-reply-edit onClick={onEdit} className={action}>
          Edit
        </button>
      ) : null}
      {mine ? (
        <button
          type="button"
          data-reply-delete
          onClick={() => on.remove(reply.id)}
          className={action}
        >
          Delete
        </button>
      ) : null}
      {onMyRipple ? (
        <button
          type="button"
          data-reply-hide
          onClick={() => on.hide(reply.id, !reply.hidden)}
          className={action}
        >
          {reply.hidden ? 'Show' : 'Hide'}
        </button>
      ) : null}
    </span>
  );
}
