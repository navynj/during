'use client';

import { useEffect, useRef, useState } from 'react';

import { Avatar, PersonName } from '@/features/people/avatar';
import { usePeople } from '@/features/people/people-provider';

import { relativeTime, type ReplyRow } from './model';
import { ReplyInput } from './reply-input';
import { ThreadLabel } from './thread-label';
import { LinkedText } from '@/components/ui/linked-text';

/** A reply's face: small, beside its words. */
const FACE_PX = 16;

export type ReplyHandlers = {
  /** A new reply; `pool` the thread it goes to, else the one the page writes in (H75, H). */
  reply: (body: string, pool?: string | null) => void;
  edit: (id: string, body: string) => void;
  remove: (id: string) => void;
  hide: (id: string, hidden: boolean) => void;
};

/**
 * A run of a block's replies (H25), oldest first; each its author's face,
 * name, age and text — "edited" once edited, "Hidden by the author" once
 * hidden. Mine I edit and delete; on my ripple I hide anyone's. With a
 * `label` (the All tab's "Only me" or "in Pancake", H), it heads the run.
 * Where a reply is written is RippleResponses' to place (ReplyField).
 */
export function ReplyList({
  replies,
  rippleAuthor,
  on,
  label = null,
}: {
  replies: ReplyRow[];
  rippleAuthor: string;
  on: ReplyHandlers;
  label?: string | null;
}) {
  const { me } = usePeople();
  const [editing, setEditing] = useState<string | null>(null);
  if (replies.length === 0) return null;
  return (
    <ol data-replies className="flex flex-col gap-2">
      {label ? (
        <li data-reply-thread-label style={{ marginLeft: FACE_PX + 8 }} className="-mb-1.5">
          <ThreadLabel>{label}</ThreadLabel>
        </li>
      ) : null}
      {replies.map((reply) => (
        <li
          key={reply.id}
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
      ))}
    </ol>
  );
}

/**
 * The field a new reply is written in (H25), opened by a Reply where that
 * Reply sits (H), with Cancel and Save; brought into view as it opens.
 */
export function ReplyField({
  onSubmit,
  onCancel,
}: {
  onSubmit: (body: string) => void;
  onCancel: () => void;
}) {
  const field = useRef<HTMLDivElement>(null);
  useEffect(() => {
    field.current?.scrollIntoView?.({ block: 'nearest' });
  }, []);
  return (
    <div ref={field} data-reply-field>
      <ReplyInput
        label="Reply"
        autoFocus
        onSubmit={(body) => {
          onSubmit(body);
          onCancel();
        }}
        onCancel={onCancel}
      />
    </div>
  );
}

/** A Reply at the foot of a run of replies (H75, H): at the replies' indent. */
export function ReplyAgain({ onClick, pool }: { onClick: () => void; pool?: string | null }) {
  return (
    <button
      type="button"
      data-reply-again={pool ?? ''}
      onClick={onClick}
      className="text-pool-500 self-start text-xs font-medium"
      style={{ marginLeft: FACE_PX + 8 }}
    >
      Reply
    </button>
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
