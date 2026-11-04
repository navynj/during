'use client';

import { initialsOf as initialsFrom } from '@/features/home/grid';
import { Avatar, PersonName } from '@/features/people/avatar';
import { usePeople } from '@/features/people/people-provider';

/**
 * Who wrote it (Yoonji, in the session): under the post's date, the
 * author's face and name (2026-10-29); a joint record's writers, each, in
 * the order of their first block.
 */
export function SplashAuthors({
  ids,
  initialsOf,
  label,
}: {
  ids: string[];
  initialsOf: Record<string, string>;
  /** Said over the faces once there is more than one (H75): *In this splash*. */
  label?: string;
}) {
  const { people } = usePeople();
  if (ids.length === 0) return null;
  return (
    <p data-splash-authors className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {label && ids.length > 1 ? (
        <span data-splash-authors-label className="text-pool-500 w-full text-xs">
          {label}
        </span>
      ) : null}
      {ids.map((id) => {
        const name = people[id]?.name ?? 'Someone';
        return (
          <span key={id} data-splash-author={id} className="flex min-w-0 items-center gap-2">
            <Avatar
              id={id}
              initials={initialsOf[id] ?? initialsFrom(name)}
              className="bg-pool-100 text-pool-500 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
            />
            <span className="text-ink truncate text-sm font-medium">
              <PersonName id={id} name={name} />
            </span>
          </span>
        );
      })}
    </p>
  );
}
