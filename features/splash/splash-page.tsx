'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

import { GhostRing } from '@/components/ui/ghost-ring';
import type { Session } from '@/features/sessions/shelves';
import type { MyCategory } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

import {
  adoptRipple,
  deleteSplash,
  setSplashPinned,
  setSplashSession,
  updateSplashHeader,
} from './actions';
import { BlockEditor, type EditorTarget } from './block-editor';
import { BlockView } from './block';
import { SplashHeader, type HeaderEdit } from './splash-header';
import type { SplashSummary } from './summary';

/** Where the page came from, for the back chip. */
export type Origin = { label: string; href: string };

/**
 * A post's page (SPEC 5, H21c): the white page above the water. The back chip
 * names where it came from; the header stack; the blocks oldest first, each
 * edited in place; an add slot at the bottom that starts a new block on the
 * page. No sheet here.
 *
 * A splashless block renders here too, as an untitled post of one; it gets a
 * row of its own the first time it needs one (H21a) and the page moves to it.
 */
export function SplashPage({
  splash,
  blocks,
  photos,
  lockedIds,
  categories,
  sessions,
  origin,
  timeZone,
  today,
}: {
  splash: SplashSummary;
  /** Oldest first. */
  blocks: RippleWithCategory[];
  photos: Record<string, (string | null)[]>;
  lockedIds: string[];
  categories: MyCategory[];
  sessions: Session[];
  origin: Origin;
  timeZone: string;
  today: IsoDate;
}) {
  const router = useRouter();
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  /** The post's row, made now if the post is a lone block (H21a). */
  async function ensureSplash(): Promise<string | null> {
    if (!splash.orphan) return splash.id;
    const result = await adoptRipple(splash.id);
    if (!result.ok) return null;
    router.replace(`/splash/${result.splash.id}?from=${encodeURIComponent(origin.href)}`);
    return result.splash.id;
  }

  async function withRow(work: (id: string) => Promise<unknown>): Promise<void> {
    const id = await ensureSplash();
    if (!id) return;
    await work(id);
    router.refresh();
  }

  function finish(): void {
    setEditor(null);
    router.refresh();
  }

  function startBlock(): void {
    void ensureSplash().then((id) => id && setEditor({ kind: 'add', splashId: id }));
  }

  return (
    <div data-splash-page className="page-rise flex flex-1 flex-col bg-white pt-3">
      <Link
        href={origin.href}
        data-back-chip
        className="text-main-900 -ml-1 flex w-fit items-center gap-0.5 pb-5 text-sm font-medium"
      >
        <ChevronLeft aria-hidden size={16} />
        {origin.label}
      </Link>

      <SplashHeader
        splash={splash}
        categories={categories}
        sessions={sessions}
        today={today}
        onEdit={(edit: HeaderEdit) => withRow((id) => updateSplashHeader(id, edit))}
        onPin={(pinned) => withRow((id) => setSplashPinned(id, pinned))}
        onSession={(sessionId) => withRow((id) => setSplashSession(id, sessionId))}
        onDelete={async () => {
          const id = splash.orphan ? null : splash.id;
          if (id) await deleteSplash(id);
          router.push(origin.href);
          router.refresh();
        }}
      />

      <ol data-blocks className="flex flex-col">
        {blocks.map((block, index) => (
          <li
            key={block.id}
            id={`block-${block.id}`}
            className={index === 0 ? 'py-2' : 'border-pool-100 border-t py-6'}
          >
            {editor?.kind === 'edit' && editor.block.id === block.id ? (
              <BlockEditor
                target={editor}
                categories={categories}
                defaultLaneId={splash.declaredLaneId}
                timeZone={timeZone}
                today={today}
                onDone={finish}
                onCancel={() => setEditor(null)}
              />
            ) : (
              <BlockView
                block={block}
                photos={photos[block.id] ?? []}
                timeZone={timeZone}
                today={today}
                onEdit={() =>
                  setEditor({ kind: 'edit', block, locked: lockedIds.includes(block.id) })
                }
              />
            )}
          </li>
        ))}
      </ol>

      {/* The add slot: the seat of the next block, at the bottom where the
          story continues. The ring ripples as the one invitation (law 3). */}
      <div data-add-slot className="border-pool-100 mt-2 border-t pt-4 pb-10">
        {editor?.kind === 'add' ? (
          <BlockEditor
            target={editor}
            categories={categories}
            defaultLaneId={splash.declaredLaneId}
            timeZone={timeZone}
            today={today}
            onDone={finish}
            onCancel={() => setEditor(null)}
          />
        ) : (
          <div className="flex items-center gap-3">
            <GhostRing label="Write the next block" onClick={startBlock} />
            <button
              type="button"
              onClick={startBlock}
              className="text-main-900 text-base font-medium"
              style={{ opacity: 0.3 }}
            >
              Drop your words here
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
