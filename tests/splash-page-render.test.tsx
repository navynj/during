// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock('next/navigation', () => ({ usePathname: () => '/splash/s1', useRouter: () => router }));

// Hoisted with the mocks that use them: a vi.mock factory runs before the
// file's own top level.
const { calls, record } = vi.hoisted(() => {
  const calls: { name: string; args: unknown[] }[] = [];
  const record =
    (name: string, result: unknown = { ok: true }) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return Promise.resolve(result);
    };
  return { calls, record };
});
vi.mock('@/features/splash/actions', () => ({
  updateSplashHeader: record('updateSplashHeader', { ok: true, splash: {} }),
  setSplashPinned: record('setSplashPinned'),
  deleteSplash: record('deleteSplash'),
  setSplashDescription: record('setSplashDescription'),
}));
vi.mock('@/features/splash/block-actions', () => ({
  addBlock: record('addBlock', { ok: true, rippleId: 'r-new' }),
  editBlock: record('editBlock', { ok: true, rippleId: 'r' }),
}));
vi.mock('@/features/ripple-sheet/actions', () => ({
  deleteRipple: record('deleteRipple', { ok: true, rippleId: 'r' }),
  setRippleLock: record('setRippleLock', { ok: true, rippleId: 'r' }),
}));
vi.mock('@/features/responses/actions', () => ({
  setReaction: record('setReaction'),
  addReply: record('addReply'),
  editReply: record('editReply'),
  deleteReply: record('deleteReply'),
  setReplyHidden: record('setReplyHidden'),
}));
vi.mock('@/lib/compress-image', async (actual) => ({
  ...(await actual<typeof import('@/lib/compress-image')>()),
  compressImage: (file: File) =>
    Promise.resolve({ full: { blob: file, size: { w: 4, h: 3 } }, display: null }),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'a1' } } }) },
    storage: { from: () => ({ upload: () => Promise.resolve({ error: null }) }) },
  }),
}));

import { InputSheetProvider, useInputSheet } from '@/features/input-sheet/sheet-provider';
import { PeopleProvider } from '@/features/people/people-provider';
import { SplashPage } from '@/features/splash/splash-page';
import { summarizeOrphan, summarizeSplash, type Splash } from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';
import type { RippleWithSplash } from '@/lib/queries/ripples';
import { written } from './written-on';

const TZ = 'America/Vancouver';
const TODAY = '2026-09-25';
const NOW = new Date('2026-09-25T20:00:00.000Z');

function lane(id: string, name: string, icon: string, position: number): MyCategory {
  return {
    id,
    user_id: 'a1',
    name,
    icon,
    default_mode: 'drop',
    position,
    created_at: '2026-01-01T00:00:00Z',
  };
}
const LANES = [
  lane('c-place', 'Place', '📍', 0),
  lane('c-media', 'Media', '🎬', 1),
  lane('c-day', 'Day', '🖋', 2),
];
function block(over: Partial<RippleWithSplash> & { id: string }): RippleWithSplash {
  return written({
    author_id: 'a1',
    thread_pool_id: null,
    video_previews: true,
    is_welcome: false,
    media_meta: {},
    note: 'fixture',
    media: [],
    occurred_on: null,
    occurred_time: null,
    started_at: null,
    ended_at: null,
    planned: false,
    participants: [],
    created_at: '2026-08-18T16:00:00.000Z',
    parent_ripple_id: null,
    splash_id: 's1',
    ...over,
  });
}

const board: Splash = {
  id: 's1',
  owner_id: 'a1',
  title: 'Whistler, two nights',
  declared_start: '2026-08-17',
  declared_end: '2026-08-20',
  declared_lane_id: 'c-place',
  session_id: null,
  icon: null,
  pinned_at: null,
  pool_id: null,
  pool_lane_id: null,
  own_pool_id: null,
  joint_invite_all: false,
  is_welcome: false,
  description: null,
  created_by: null,
  type: 'free',
  prompt: null,
  ends_at: null,
  created_at: '2026-08-16T16:00:00.000Z',
  written_on: '2026-08-16',
};

// Oldest first, as the page receives them.
const blocks = [
  block({ id: 'first', note: 'sea to sky', occurred_on: '2026-08-17', occurred_time: '11:30:00' }),
  block({
    id: 'night',
    note: 'the village',
    occurred_on: '2026-08-17',
    occurred_time: '21:15:00',
    media: ['a1/x.jpg'],
  }),
  block({
    id: 'later',
    note: 'watched it back',
    occurred_on: '2026-08-20',
  }),
];

beforeEach(() => {
  calls.length = 0;
  router.push.mockClear();
  router.replace.mockClear();
  router.refresh.mockClear();
  window.URL.createObjectURL = () => 'blob:preview';
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
});
afterEach(cleanup);

function Deleted() {
  const { pendingDeletes } = useInputSheet();
  return <output data-deleted>{pendingDeletes.join(',')}</output>;
}

function page(over: Partial<Parameters<typeof SplashPage>[0]> = {}) {
  return render(
    <InputSheetProvider>
      <Deleted />
      <SplashPage
        splash={summarizeSplash(board, blocks, TZ, NOW)}
        blocks={blocks}
        photos={{ night: [null, 'https://signed/x.jpg'] }}
        lockedIds={[]}
        categories={LANES}
        timeZone={TZ}
        today={TODAY}
        {...over}
      />
    </InputSheetProvider>,
  );
}

describe('the white page above the water (SPEC 5, H21c)', () => {
  it('is the white detail with no back chip: the sheet it sits in closes it (review)', () => {
    const { container } = page();
    const root = container.querySelector('[data-splash-page]')!;
    expect(root.className).toContain('bg-white');
    expect(container.querySelector('[data-back-chip]')).toBeNull();
  });

  it('stacks the header left-aligned: its own lane, title, range, wave underline by blocks', () => {
    const { container } = page();
    const tags = [...container.querySelectorAll('[data-lane-tags] > span')].map(
      (t) => t.textContent,
    );
    // The post's lane alone (H24): a block's frozen Media lane adds no tag.
    expect(tags).toEqual(['📍Place']);
    expect(container.querySelector('[data-splash-title]')!.textContent).toBe(
      'Whistler, two nights',
    );
    expect(container.querySelector('[data-range]')!.textContent).toBe('2026. 8. 17 ~ 2026. 8. 20');
    // No wave under the title (H78).
    expect(container.querySelector('[data-wave-underline], [data-wave-rule]')).toBeNull();
  });

  it('writes who wrote it under the date, and where it sits in a pool on the line under it', () => {
    const { container } = render(
      <PeopleProvider me="u-me" people={{ 'u-me': { name: 'Yoonji', photo: null } }}>
        <InputSheetProvider>
          <SplashPage
            splash={summarizeSplash(board, blocks, TZ, NOW)}
            blocks={blocks}
            photos={{}}
            lockedIds={[]}
            categories={LANES}
            timeZone={TZ}
            today={TODAY}
            initials="YL"
            poolTags={['Our Pool · 🎲 Games']}
          />
        </InputSheetProvider>
      </PeopleProvider>,
    );
    const header = container.querySelector('[data-splash-header]')!;
    const byline = header.querySelector('[data-splash-byline]')!;
    // After the date, inside the header (2026-10-29).
    const range = header.querySelector('[data-range]')!;
    expect(range.compareDocumentPosition(byline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(byline.querySelector('[data-splash-author]')?.getAttribute('data-splash-author')).toBe(
      'u-me',
    );
    // The pool and its lane on a line of their own under the author, so a
    // name is never cut short beside them (H75).
    expect(byline.className).toContain('flex-col');
    expect(byline.lastElementChild?.querySelector('[data-origin-tag]')?.textContent).toBe(
      'Our Pool · 🎲 Games',
    );
    expect(container.querySelectorAll('[data-origin-tags]')).toHaveLength(1);
  });

  it('reads the blocks by their day inside the range under small day labels, photos full width', () => {
    const { container } = page();
    const ids = [...container.querySelectorAll('[data-block]')].map((b) =>
      b.getAttribute('data-block'),
    );
    expect(ids).toEqual(['first', 'night', 'later']);
    const labels = [...container.querySelectorAll('[data-block-date]')].map((l) => l.textContent);
    // Inside a range, a block reads by its day alone: no clock (0031).
    expect(labels[0]).toBe('Aug 17');
    expect(labels[2]).toBe('Aug 20');
    expect(container.querySelector('[data-block-body]')!.className).toMatch(/text-\[15px\]/);
    expect(container.querySelector('[data-photo]')!.className).toContain('w-full');
    // A tall photo stops at 70vh in the wide panel (H75).
    expect(container.querySelector('[data-photo]')!.className).toContain('lg:max-h-[70vh]');
    expect(container.querySelector('[data-photo-placeholder]')).not.toBeNull();
  });

  it('reads a splash written alone as one post: no avatar beside its blocks (testers)', () => {
    const { container } = page({ initials: 'YL' });
    const solo = container.querySelector('[data-blocks] [data-solo-blocks]')!;
    expect(solo.querySelectorAll('[data-block]')).toHaveLength(3);
    expect(container.querySelector('[data-blocks] [data-ripple-thread]')).toBeNull();
    expect(container.querySelectorAll('[data-thread-avatar]')).toHaveLength(0);
  });

  it('shows the face once on a splash written alone: the byline’s, and nothing under it', () => {
    const { container } = render(
      <PeopleProvider me="a1" people={{ a1: { name: 'Yoonji', photo: null } }}>
        <InputSheetProvider>
          <SplashPage
            splash={summarizeSplash(board, blocks, TZ, NOW)}
            blocks={blocks}
            photos={{}}
            lockedIds={[]}
            categories={LANES}
            timeZone={TZ}
            today={TODAY}
            initials="YL"
          />
        </InputSheetProvider>
      </PeopleProvider>,
    );
    expect(container.querySelectorAll('[data-splash-author]')).toHaveLength(1);
    // The initials appear once on the page: in the byline, not again by a block.
    expect(container.querySelector('[data-blocks]')!.textContent).not.toContain('YL');
    expect(container.querySelectorAll('[data-thread-avatar]')).toHaveLength(0);
    expect(container.querySelector('[data-solo-blocks]')).not.toBeNull();
  });

  it('threads the ripples once someone else adds theirs, the author’s first', () => {
    const mixed = [...blocks, block({ id: 'theirs', author_id: 'u-mina', note: 'mine too' })];
    const { container } = page({
      initials: 'YL',
      blocks: mixed,
      splash: summarizeSplash(board, mixed, TZ, NOW),
      initialsOf: { 'u-mina': 'MI' },
    });
    const thread = container.querySelector('[data-blocks] [data-ripple-thread]')!;
    const avatars = thread.querySelectorAll('[data-thread-avatar]');
    expect(avatars).toHaveLength(4);
    expect(avatars[0].textContent).toBe('YL');
    expect(thread.querySelectorAll('[data-thread-line]')).toHaveLength(3);
    // The body sits in the column to the right of the avatar.
    const entry = thread.querySelector('[data-thread-entry="first"]')!;
    expect(entry.children[1].querySelector('[data-block="first"]')).not.toBeNull();
    expect(container.querySelector('[data-solo-blocks]')).toBeNull();
  });

  it('edits the author’s block the same way in both layouts', () => {
    const mixed = [...blocks, block({ id: 'theirs', author_id: 'u-mina', note: 'mine too' })];
    for (const props of [{}, { blocks: mixed, splash: summarizeSplash(board, mixed, TZ, NOW) }]) {
      const { container, unmount } = render(
        <PeopleProvider me="a1" people={{ a1: { name: 'Yoonji', photo: null } }}>
          <InputSheetProvider>
            <SplashPage
              splash={summarizeSplash(board, blocks, TZ, NOW)}
              blocks={blocks}
              photos={{}}
              lockedIds={[]}
              categories={LANES}
              timeZone={TZ}
              today={TODAY}
              {...props}
            />
          </InputSheetProvider>
        </PeopleProvider>,
      );
      fireEvent.click(container.querySelector('[data-block="night"]')!);
      expect(container.querySelector('[data-block-editor="night"]')).not.toBeNull();
      // Someone else's block is read only.
      expect(container.querySelector('[data-block="theirs"][data-read-only]') !== null).toBe(
        'blocks' in props,
      );
      unmount();
    }
  });

  it('is one column at every width: the header, then the blocks, then the add row (H75)', () => {
    const { container } = page();
    const root = container.querySelector('[data-splash-page]')!;
    expect(root.className).not.toContain('lg:grid');
    const side = container.querySelector('[data-splash-side]')!;
    const blocks = container.querySelector('[data-splash-blocks]')!;
    expect(side.querySelector('[data-splash-header]')).not.toBeNull();
    expect(blocks.querySelector('[data-blocks]')).not.toBeNull();
    expect(blocks.querySelector('[data-add-slot]')).not.toBeNull();
    expect(side.compareDocumentPosition(blocks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('never says thread, never fills a tag', () => {
    const { container } = page();
    expect(container.textContent).not.toMatch(/thread/i);
    for (const tag of container.querySelectorAll('[data-lane-tags] > span')) {
      expect(tag.className).not.toMatch(/bg-main-900|bg-ink/);
    }
  });
});

describe('writing on the page, in place', () => {
  it('puts the cursor in a tapped block, and Cancel puts it back', () => {
    const { container, getByText, getByLabelText } = page();
    fireEvent.click(container.querySelector('[data-block="night"]')!);
    const editor = container.querySelector('[data-block-editor="night"]')!;
    expect(editor).not.toBeNull();
    expect((getByLabelText('Block') as HTMLTextAreaElement).value).toBe('the village');
    expect(container.querySelector('[data-block="night"]')).toBeNull();
    fireEvent.click(getByText('Cancel'));
    expect(container.querySelector('[data-block-editor]')).toBeNull();
    expect(container.querySelector('[data-block="night"]')).not.toBeNull();
  });

  it('grows the field with its words rather than scrolling inside it', () => {
    const { container } = page();
    fireEvent.click(container.querySelector('[data-block="night"]')!);
    const field = container.querySelector<HTMLTextAreaElement>('[data-block-field]')!;
    expect(field.className).toContain('overflow-hidden');
    expect(field.className).toContain('resize-none');
  });

  it('saves a block’s words, photos and its day inside the range, never a lane (H24, 0031)', async () => {
    const { container, getByText, getByLabelText } = page();
    fireEvent.click(container.querySelector('[data-block="first"]')!);
    const editor = container.querySelector<HTMLElement>('[data-block-editor="first"]')!;
    expect(editor.querySelector('[role="group"][aria-label="Category"]')).toBeNull();
    expect(within(editor).queryByText('+ Add Time')).toBeNull();
    // Its day, Aug 17, picked among the range's days only.
    const day = within(editor).getByLabelText('Day') as HTMLSelectElement;
    expect(day.value).toBe('2026-08-17');
    expect([...day.options].map((o) => o.textContent)).toEqual([
      'Aug 17',
      'Aug 18',
      'Aug 19',
      'Aug 20',
    ]);
    fireEvent.change(day, { target: { value: '2026-08-19' } });
    fireEvent.change(getByLabelText('Block'), { target: { value: 'sea to sky, fog' } });
    fireEvent.click(getByText('Save'));
    await waitFor(() => expect(calls.some((c) => c.name === 'editBlock')).toBe(true));
    expect(calls.find((c) => c.name === 'editBlock')!.args[0]).toEqual({
      id: 'first',
      note: 'sea to sky, fog',
      media: [],
      mediaMeta: {},
      occurredOn: '2026-08-19',
    });
    // editBlock revalidates: the page comes back in its response, not read twice.
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('puts the cursor in the add row when opened to write (Board: "Add your side")', () => {
    const { container } = page({ writing: true });
    const row = container.querySelector('[data-add-row]')!;
    expect(row.hasAttribute('data-open')).toBe(true);
    expect(document.activeElement).toBe(row.querySelector('[data-add-field]'));
  });

  it('is one quiet row under a flat hairline: my face, a field that says what it does, a photo button (H75, H78)', () => {
    const { container } = page({ initials: 'YL' });
    const slot = container.querySelector('[data-add-slot]')!;
    expect(slot.querySelector('[data-add-rule] > div')!.className).toContain('border-pool-200');
    expect(slot.querySelector('[data-add-wave], [data-wave-rule]')).toBeNull();
    const row = slot.querySelector('[data-add-row]')!;
    expect(row.hasAttribute('data-open')).toBe(false);
    expect(row.querySelector<HTMLTextAreaElement>('[data-add-field]')!.placeholder).toBe(
      'Add to this page',
    );
    expect(row.querySelector('[data-add-photo]')).not.toBeNull();
    expect(row.querySelector('[data-add-drop]')).toBeNull();
    // No card, no ring, no title.
    expect(slot.querySelector('[data-badge], [data-add-card], [data-add-label]')).toBeNull();
    expect(slot.className).not.toMatch(/border/);
  });

  it('opens to lines and a Drop in focus, and folds back to one row when left empty', () => {
    const { container } = page();
    const row = container.querySelector('[data-add-row]')!;
    const field = row.querySelector<HTMLTextAreaElement>('[data-add-field]')!;
    fireEvent.focus(field);
    expect(row.hasAttribute('data-open')).toBe(true);
    expect(field.rows).toBe(3);
    expect(row.querySelector<HTMLButtonElement>('[data-add-drop]')!.disabled).toBe(true);
    fireEvent.blur(field);
    expect(row.hasAttribute('data-open')).toBe(false);
    expect(field.rows).toBe(1);
    // With words in it, it stays open when left.
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'half a thought' } });
    fireEvent.blur(field);
    expect(row.hasAttribute('data-open')).toBe(true);
  });

  it('starts a new block on a range at its last day when today is past it, never a lane (0031)', async () => {
    const { container, getByText } = page();
    const row = container.querySelector<HTMLElement>('[data-add-row]')!;
    const field = row.querySelector<HTMLTextAreaElement>('[data-add-field]')!;
    fireEvent.focus(field);
    expect(row.querySelector('[role="group"][aria-label="Category"]')).toBeNull();
    // Today (Sep 25) is past Aug 17–20: the range's last day.
    expect((within(row).getByLabelText('Day') as HTMLSelectElement).value).toBe('2026-08-20');
    fireEvent.change(field, { target: { value: 'the drive home' } });
    fireEvent.click(getByText('Drop'));
    await waitFor(() => expect(calls.some((c) => c.name === 'addBlock')).toBe(true));
    const added = calls.find((c) => c.name === 'addBlock')!.args[0];
    expect(added).toMatchObject({
      splashId: 's1',
      note: 'the drive home',
      media: [],
      occurredOn: '2026-08-20',
    });
    expect(added).not.toHaveProperty('categoryId');
    // Dropped: the row is empty and one row again.
    expect(field.value).toBe('');
    expect(row.hasAttribute('data-open')).toBe(false);
  });

  it('cancels a few words at once, back to one row; asks first past a few words', () => {
    const { container, getByText } = page();
    const row = container.querySelector<HTMLElement>('[data-add-row]')!;
    const field = row.querySelector<HTMLTextAreaElement>('[data-add-field]')!;
    expect(row.querySelector('[data-add-cancel]')).toBeNull();
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'just three words' } });
    fireEvent.click(row.querySelector('[data-add-cancel]')!);
    expect(row.querySelector('[data-add-discard]')).toBeNull();
    expect(field.value).toBe('');
    expect(row.hasAttribute('data-open')).toBe(false);

    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'four words and more' } });
    fireEvent.click(row.querySelector('[data-add-cancel]')!);
    expect(row.querySelector('[data-add-discard]')!.textContent).toMatch(/Discard this\?/);
    fireEvent.click(getByText('Keep writing'));
    expect(row.querySelector('[data-add-discard]')).toBeNull();
    expect(field.value).toBe('four words and more');
    fireEvent.click(row.querySelector('[data-add-cancel]')!);
    fireEvent.click(getByText('Discard'));
    expect(field.value).toBe('');
    expect(row.hasAttribute('data-open')).toBe(false);
    expect(calls.some((c) => c.name === 'addBlock')).toBe(false);
  });

  it('leaves the field on Escape, the draft kept', () => {
    const { container } = page();
    const row = container.querySelector<HTMLElement>('[data-add-row]')!;
    const field = row.querySelector<HTMLTextAreaElement>('[data-add-field]')!;
    field.focus();
    fireEvent.change(field, { target: { value: 'half a thought' } });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(document.activeElement).not.toBe(field);
    expect(field.value).toBe('half a thought');
  });

  it('offers Show video previews once its words link a video, and saves the choice (part 5)', async () => {
    const { container, getByText } = page();
    const row = container.querySelector<HTMLElement>('[data-add-row]')!;
    const field = row.querySelector<HTMLTextAreaElement>('[data-add-field]')!;
    fireEvent.focus(field);
    expect(row.querySelector('[data-video-previews]')).toBeNull();
    fireEvent.change(field, { target: { value: 'https://youtu.be/dQw4w9WgXcQ' } });
    const toggle = row.querySelector('[data-video-previews]')!;
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    fireEvent.click(getByText('Drop'));
    await waitFor(() => expect(calls.some((c) => c.name === 'addBlock')).toBe(true));
    expect(calls.find((c) => c.name === 'addBlock')!.args[0]).toMatchObject({
      videoPreviews: false,
    });
  });

  it('offers no day on a one-day post: the block takes the post’s (H24)', async () => {
    const oneDay = { ...board, declared_end: null };
    const { container, getByText } = page({
      splash: summarizeSplash(oneDay, blocks, TZ, NOW),
    });
    const row = container.querySelector<HTMLElement>('[data-add-row]')!;
    const field = row.querySelector<HTMLTextAreaElement>('[data-add-field]')!;
    fireEvent.focus(field);
    expect(within(row).queryByLabelText('Day')).toBeNull();
    fireEvent.change(field, { target: { value: 'lunch' } });
    fireEvent.click(getByText('Drop'));
    await waitFor(() => expect(calls.some((c) => c.name === 'addBlock')).toBe(true));
    expect(calls.find((c) => c.name === 'addBlock')!.args[0]).not.toHaveProperty('occurredOn');
  });

  it('on a one-day post widened into a range, shows a frozen day inside it and reads one outside as undated (0031)', () => {
    const widened = { ...board, declared_start: '2026-10-08', declared_end: '2026-10-12' };
    const frozen = [
      block({
        id: 'frozen-oct10',
        occurred_on: '2026-10-10',
        created_at: '2026-10-08T16:00:00.000Z',
      }),
      block({
        id: 'frozen-sep1',
        occurred_on: '2026-09-01',
        created_at: '2026-10-08T17:00:00.000Z',
      }),
    ];
    const { container } = page({
      splash: summarizeSplash(widened, frozen, TZ, NOW),
      blocks: frozen,
    });
    const ids = [...container.querySelectorAll('[data-block]')].map((b) =>
      b.getAttribute('data-block'),
    );
    expect(ids).toEqual(['frozen-sep1', 'frozen-oct10']);
    const labels = [...container.querySelectorAll('[data-block-date]')].map((l) => l.textContent);
    expect(labels).toEqual(['Oct 8', 'Oct 10']);
  });

  it('reads Oct 10 before Oct 12 inside a range, whatever order they were written in (0031)', () => {
    const range = { ...board, declared_start: '2026-10-08', declared_end: '2026-10-12' };
    const late = [
      block({ id: 'oct12', occurred_on: '2026-10-12', created_at: '2026-10-12T16:00:00.000Z' }),
      block({ id: 'oct10', occurred_on: '2026-10-10', created_at: '2026-10-13T16:00:00.000Z' }),
    ];
    const { container } = page({
      splash: summarizeSplash(range, late, TZ, NOW),
      blocks: late,
    });
    const ids = [...container.querySelectorAll('[data-block]')].map((b) =>
      b.getAttribute('data-block'),
    );
    expect(ids).toEqual(['oct10', 'oct12']);
  });

  it('carries the lock beside the block, and deletes a block behind a confirm', async () => {
    const { container, getByText } = page({ lockedIds: ['night'] });
    fireEvent.click(container.querySelector('[data-block="night"]')!);
    expect(getByText('Only me')).toBeTruthy();
    fireEvent.click(getByText('Only me'));
    await waitFor(() => expect(calls.some((c) => c.name === 'setRippleLock')).toBe(true));
    expect(calls.find((c) => c.name === 'setRippleLock')!.args).toEqual(['night', false]);

    fireEvent.click(getByText('Delete'));
    expect(getByText('Deletes this block')).toBeTruthy();
    fireEvent.click(container.querySelector('[data-block-editor] .text-main-900')!);
    await waitFor(() => expect(calls.some((c) => c.name === 'deleteRipple')).toBe(true));
  });
});

describe('the header menu', () => {
  it('pins and unpins from the quiet menu', async () => {
    const { getByLabelText, getByText } = page();
    fireEvent.click(getByLabelText('More'));
    fireEvent.click(getByText('Pin'));
    await waitFor(() => expect(calls.some((c) => c.name === 'setSplashPinned')).toBe(true));
    expect(calls.find((c) => c.name === 'setSplashPinned')!.args).toEqual(['s1', true]);
  });

  it('says a delete takes the blocks with it (H21), then, outside a sheet, goes Home', async () => {
    const { getByLabelText, getByText, container } = page();
    fireEvent.click(getByLabelText('More'));
    fireEvent.click(getByText('Delete'));
    expect(container.querySelector('[data-delete-confirm]')!.textContent).toBe(
      'Deletes the page and its 3 blocks.',
    );
    fireEvent.click(container.querySelector('[role="alertdialog"] .text-main-900')!);
    await waitFor(() => expect(calls.some((c) => c.name === 'deleteSplash')).toBe(true));
    expect(router.push).toHaveBeenCalledWith('/');
    // Gone from every surface at once: the provider carries the id. Waited
    // for: the state lands a render after the action is called.
    await waitFor(() => expect(container.querySelector('[data-deleted]')!.textContent).toBe('s1'));
  });

  it('deletes a lone block’s post by deleting the block', async () => {
    const lone = block({ id: 'r-lone', note: 'alone', splash_id: null });
    const { getByLabelText, getByText, container } = page({
      splash: summarizeOrphan(lone, TZ, NOW),
      blocks: [lone],
    });
    fireEvent.click(getByLabelText('More'));
    fireEvent.click(getByText('Delete'));
    fireEvent.click(container.querySelector('[role="alertdialog"] .text-main-900')!);
    await waitFor(() => expect(calls.some((c) => c.name === 'deleteRipple')).toBe(true));
    expect(calls.find((c) => c.name === 'deleteRipple')!.args).toEqual(['r-lone']);
    expect(calls.some((c) => c.name === 'deleteSplash')).toBe(false);
  });

  it('edits the post\u2019s own icon in place, saving it with the header', async () => {
    const { getByLabelText } = page();
    fireEvent.change(getByLabelText('Icon'), { target: { value: '🏔️' } });
    await waitFor(() => expect(calls.some((c) => c.name === 'updateSplashHeader')).toBe(true));
    expect(calls.find((c) => c.name === 'updateSplashHeader')!.args[1]).toMatchObject({
      icon: '🏔️',
    });
  });

  it('edits the title in place', async () => {
    const { getByLabelText } = page();
    fireEvent.click(getByLabelText('Edit the title'));
    const input = getByLabelText('Title') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Whistler, three nights' } });
    fireEvent.blur(input);
    await waitFor(() => expect(calls.some((c) => c.name === 'updateSplashHeader')).toBe(true));
    expect(calls.find((c) => c.name === 'updateSplashHeader')!.args).toEqual([
      's1',
      {
        title: 'Whistler, three nights',
        icon: null,
        declaredStart: '2026-08-17',
        declaredEnd: '2026-08-20',
        declaredLaneId: 'c-place',
      },
    ]);
  });
});

describe('the header’s date, the drop sheet’s control', () => {
  const oneDayPage = (declared_end: string | null) => {
    const splash = { ...board, declared_start: '2026-08-17', declared_end };
    return page({ splash: summarizeSplash(splash, blocks, TZ, NOW) });
  };
  const saved = () => calls.find((c) => c.name === 'updateSplashHeader')!.args[1];

  it('shows one field and + add end date when there is no end date', () => {
    const { getByLabelText, queryByLabelText, getByText } = oneDayPage(null);
    fireEvent.click(getByLabelText('Edit the declared date'));
    expect((getByLabelText('Date') as HTMLInputElement).value).toBe('2026-08-17');
    expect(queryByLabelText('End date')).toBeNull();
    expect(getByText('+ add end date')).toBeTruthy();
    // A post's date is changed, never removed (H24).
    expect(queryByLabelText('Remove the time')).toBeNull();
  });

  it('shows one field when the end is the start', () => {
    const { getByLabelText, queryByLabelText, getByText } = oneDayPage('2026-08-17');
    fireEvent.click(getByLabelText('Edit the declared date'));
    expect(queryByLabelText('End date')).toBeNull();
    expect(getByText('+ add end date')).toBeTruthy();
  });

  it('shows both fields on a range', () => {
    const { getByLabelText } = page();
    fireEvent.click(getByLabelText('Edit the declared date'));
    expect((getByLabelText('End date') as HTMLInputElement).value).toBe('2026-08-20');
  });

  it('adds an end date, and takes it away by its × or by setting it to the start', async () => {
    const { getByLabelText, queryByLabelText, getByText } = oneDayPage(null);
    fireEvent.click(getByLabelText('Edit the declared date'));
    fireEvent.click(getByText('+ add end date'));
    fireEvent.change(getByLabelText('End date'), { target: { value: '2026-08-19' } });
    fireEvent.click(getByLabelText('Remove the end'));
    expect(queryByLabelText('End date')).toBeNull();

    fireEvent.click(getByText('+ add end date'));
    fireEvent.change(getByLabelText('End date'), { target: { value: '2026-08-19' } });
    fireEvent.change(getByLabelText('End date'), { target: { value: '2026-08-17' } });
    expect(queryByLabelText('End date')).toBeNull();

    fireEvent.click(getByText('+ add end date'));
    fireEvent.change(getByLabelText('End date'), { target: { value: '2026-08-19' } });
    fireEvent.click(getByText('Done'));
    await waitFor(() => expect(calls.some((c) => c.name === 'updateSplashHeader')).toBe(true));
    expect(saved()).toMatchObject({ declaredStart: '2026-08-17', declaredEnd: '2026-08-19' });
  });

  it('saves an end on the start’s day as no end date', async () => {
    const { getByLabelText, getByText } = oneDayPage(null);
    fireEvent.click(getByLabelText('Edit the declared date'));
    // + add end date opens on the start's day; Done with it there stores none.
    fireEvent.click(getByText('+ add end date'));
    fireEvent.click(getByText('Done'));
    await waitFor(() => expect(calls.some((c) => c.name === 'updateSplashHeader')).toBe(true));
    expect(saved()).toMatchObject({ declaredStart: '2026-08-17', declaredEnd: null });
  });

  it('normalizes a stored end = start the next time the post is saved', async () => {
    const { getByLabelText } = oneDayPage('2026-08-17');
    fireEvent.click(getByLabelText('Edit the title'));
    fireEvent.change(getByLabelText('Title'), { target: { value: 'One night' } });
    fireEvent.blur(getByLabelText('Title'));
    await waitFor(() => expect(calls.some((c) => c.name === 'updateSplashHeader')).toBe(true));
    expect(saved()).toMatchObject({ declaredStart: '2026-08-17', declaredEnd: null });
  });
});

describe('a block read alone: its post is a joint splash of a pool I left (H23, H24)', () => {
  const lone = block({
    id: 'r-lone',
    note: 'coffee went cold while I read the whole thing',
    splash_id: null,
  });

  it('reads as one, with its first words as a ghost title', () => {
    const { container } = page({ splash: summarizeOrphan(lone, TZ, NOW), blocks: [lone] });
    expect(container.querySelector('[data-splash-title]')!.textContent).toBe(
      'coffee went cold while I read…',
    );
    expect(container.querySelectorAll('[data-block]')).toHaveLength(1);
  });

  it('is read, never written on: no add slot, no header to edit, no pin', () => {
    const { queryByText, queryByLabelText, container } = page({
      splash: summarizeOrphan(lone, TZ, NOW),
      blocks: [lone],
    });
    expect(queryByText('Drop your words here')).toBeNull();
    expect(container.querySelector('[data-add-slot]')).toBeNull();
    expect(queryByLabelText('Edit the title')).toBeNull();
  });
});

describe('my record’s sides, a tab per pool (0035)', () => {
  it('shows my ripples and the chosen pool’s members’, the off pool muted', () => {
    const theirs = [
      block({ id: 'side-a', author_id: 'u-mina', note: 'from Crew', thread_pool_id: 'p-crew' }),
      block({ id: 'side-b', author_id: 'u-jae', note: 'from Club', thread_pool_id: 'p-club' }),
    ];
    const { container, getByRole } = page({
      blocks: [...blocks, ...theirs],
      threads: [
        { poolId: 'p-crew', label: 'Crew', count: 1, off: false },
        { poolId: 'p-club', label: 'Club', count: 1, off: true },
        { poolId: 'p-quiet', label: 'Pancake', count: 0, off: false },
      ],
      initialsOf: { 'u-mina': 'MI', 'u-jae': 'JA' },
    });
    const tabs = [...container.querySelectorAll('[data-thread-tab]')].map((t) => t.textContent);
    // A zero is no number at all (H75).
    expect(tabs).toEqual(['All', 'Crew · 1', 'Club (off)', 'Pancake']);
    expect(container.querySelector('[data-thread-tab="p-club"]')!.hasAttribute('data-off')).toBe(
      true,
    );
    const shown = () => container.querySelector('[data-blocks]')!.textContent ?? '';
    // All first and chosen: every pool's at once.
    expect(getByRole('tab', { name: 'All' }).getAttribute('aria-selected')).toBe('true');
    expect(shown()).toContain('from Crew');
    expect(shown()).toContain('from Club');
    // Underlined, never filled: the chosen one in ink with a line under it.
    const all = getByRole('tab', { name: 'All' });
    expect(all.className).not.toContain('bg-ink');
    expect(all.querySelector('span.bg-ink')).not.toBeNull();
    expect(getByRole('tab', { name: 'Crew · 1' }).querySelector('span.bg-ink')).toBeNull();
    fireEvent.click(getByRole('tab', { name: 'Crew · 1' }));
    expect(shown()).toContain('from Crew');
    expect(shown()).not.toContain('from Club');
    fireEvent.click(getByRole('tab', { name: 'Club (off)' }));
    expect(shown()).toContain('from Club');
    expect(shown()).not.toContain('from Crew');
  });
});

describe('the pool tabs and All’s labels (H75)', () => {
  const reply = (id: string, ripple: string, pool: string | null, at: number) => ({
    id,
    ripple_id: ripple,
    author_id: pool ? 'u-mina' : 'a1',
    body: `reply ${id}`,
    created_at: `2026-10-26T09:0${at}:00Z`,
    edited_at: null,
    hidden: false,
    former: false,
    thread_pool_id: pool,
  });
  const theirs = [
    block({ id: 'side-a', author_id: 'u-mina', note: 'from Crew', thread_pool_id: 'p-crew' }),
  ];
  const threads = [
    { poolId: 'p-crew', label: 'Crew', count: 1, off: false },
    { poolId: 'p-pan', label: 'Pancake', count: 2, off: false },
  ];
  const view = (over: Partial<Parameters<typeof SplashPage>[0]> = {}) =>
    page({
      blocks: [...blocks, ...theirs],
      threads,
      initialsOf: { 'u-mina': 'MI' },
      poolTags: ['Crew · 🎲 Games', 'Pancake · 🍳 Food'],
      respondable: true,
      responses: {
        reactions: [],
        replies: [
          reply('r1', 'first', 'p-pan', 1),
          reply('r2', 'first', 'p-pan', 2),
          reply('r3', 'first', 'p-crew', 3),
          reply('r4', 'first', null, 4),
          reply('r5', 'first', 'p-pan', 5),
        ],
      },
      ...over,
    });

  it('pins under the compact bar, outside the header that scrolls away, edge to edge on white, never wrapping', () => {
    const { container } = view();
    const row = container.querySelector('[data-thread-tabs]')!;
    expect(row.closest('[data-splash-side]')).toBeNull();
    expect(row.className).toMatch(/sticky top-12/);
    expect(row.className).toMatch(/overflow-x-auto/);
    expect(row.className).toMatch(/no-scrollbar/);
    expect(row.className).toMatch(/bg-white/);
    expect(row.className).toMatch(/border-b/);
    for (const tab of row.querySelectorAll('[data-thread-tab]')) {
      expect(tab.className).toMatch(/whitespace-nowrap/);
      expect(tab.className).toMatch(/shrink-0/);
      expect(tab.className).not.toMatch(/truncate|\bh-\d/);
    }
  });

  it('drops the pool tags line under the byline while tabs show; keeps it without tabs', () => {
    expect(view().container.querySelector('[data-origin-tags]')).toBeNull();
    cleanup();
    expect(view({ threads: [] }).container.querySelector('[data-origin-tags]')).not.toBeNull();
  });

  /** The page as its owner reads it (a1), so its All tab knows whose words are whose. */
  const asOwner = (over: Partial<Parameters<typeof SplashPage>[0]> = {}) => {
    const rendered = view(over);
    rendered.rerender(
      <PeopleProvider me="a1" people={{ a1: { name: 'Yoonji', photo: null } }}>
        <InputSheetProvider>
          <Deleted />
          <SplashPage
            splash={summarizeSplash(board, [...blocks, ...theirs], TZ, NOW)}
            blocks={[...blocks, ...theirs]}
            photos={{}}
            lockedIds={[]}
            categories={LANES}
            timeZone={TZ}
            today={TODAY}
            threads={threads}
            initialsOf={{ 'u-mina': 'MI' }}
            respondable
            responses={{
              reactions: [],
              replies: [
                reply('r1', 'first', 'p-pan', 1),
                reply('r2', 'first', 'p-pan', 2),
                reply('r3', 'first', 'p-crew', 3),
                reply('r4', 'first', null, 4),
                reply('r5', 'first', 'p-pan', 5),
              ],
            }}
            {...over}
          />
        </InputSheetProvider>
      </PeopleProvider>,
    );
    return rendered;
  };
  const under = (container: HTMLElement, ripple: string) =>
    container.querySelector(`[data-ripple-responses="${ripple}"]`) as HTMLElement;
  const write = (root: HTMLElement, text: string) => {
    const field = root.querySelector('[data-reply-field] textarea') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: text } });
    fireEvent.click(
      within(root.querySelector('[data-reply-field]') as HTMLElement).getByText('Save'),
    );
  };

  it('on All, labels someone else’s ripple; mine to me alone first under Only me, then each pool’s run (H)', () => {
    const { container } = asOwner();
    expect(
      container.querySelector('[data-block-entry="side-a"] [data-ripple-thread-label]')!
        .textContent,
    ).toBe('in Crew');
    expect(
      container.querySelector('[data-block-entry="first"] [data-ripple-thread-label]'),
    ).toBeNull();
    const groups = [...under(container, 'first').querySelectorAll('[data-reply-group]')].map(
      (g) =>
        `${g.querySelector('[data-reply-thread-label]')!.textContent}: ${[
          ...g.querySelectorAll('[data-reply]'),
        ]
          .map((r) => r.getAttribute('data-reply'))
          .join(',')}`,
    );
    expect(groups).toEqual(['Only me: r4', 'in Pancake: r1,r2,r5', 'in Crew: r3']);
    // The card stack's own text style.
    expect(under(container, 'first').querySelector('[data-card-thread-label]')!.className).toBe(
      'text-pool-500 text-[10px] font-medium',
    );
    // Each pool's run ends in its own Reply; Only me's does not.
    expect(
      [...under(container, 'first').querySelectorAll('[data-reply-again]')].map((b) =>
        b.getAttribute('data-reply-again'),
      ),
    ).toEqual(['p-pan', 'p-crew']);
  });

  it('on All, the Reply under the ripple writes to me alone and opens above every run (H)', async () => {
    const { container } = asOwner();
    const root = under(container, 'first');
    fireEvent.click(root.querySelector('[data-reply-toggle="direct"]')!);
    const field = root.querySelector('[data-reply-field]')!;
    expect(
      field.compareDocumentPosition(root.querySelector('[data-reply-group]')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    write(root, 'just for me');
    await waitFor(() => expect(calls.some((c) => c.name === 'addReply')).toBe(true));
    expect(calls.find((c) => c.name === 'addReply')!.args[0]).toMatchObject({
      rippleId: 'first',
      body: 'just for me',
      poolId: null,
    });
  });

  it('on All, a pool’s Reply writes to that pool and opens at the end of its run (H)', async () => {
    const { container } = asOwner();
    const group = under(container, 'first').querySelector('[data-reply-group="p-crew"]')!;
    fireEvent.click(group.querySelector('[data-reply-again="p-crew"]')!);
    const field = group.querySelector('[data-reply-field]')!;
    expect(group.lastElementChild).toBe(field);
    write(group as HTMLElement, 'to Crew');
    await waitFor(() => expect(calls.some((c) => c.name === 'addReply')).toBe(true));
    expect(calls.find((c) => c.name === 'addReply')!.args[0]).toMatchObject({
      body: 'to Crew',
      poolId: 'p-crew',
    });
  });

  it('in a pool’s tab with its replies, the Reply under the ripple is gone; the one at the end writes there (H)', async () => {
    const { container, getByRole } = asOwner();
    fireEvent.click(getByRole('tab', { name: 'Pancake · 2' }));
    const root = under(container, 'first');
    expect(root.querySelector('[data-reply-toggle]')).toBeNull();
    // The chips keep the row's right end.
    expect(root.querySelector('[data-reactions] > span.ml-auto')).not.toBeNull();
    fireEvent.click(root.querySelector('[data-reply-again]')!);
    expect(root.lastElementChild!.hasAttribute('data-reply-field')).toBe(true);
    write(root, 'to Pancake');
    await waitFor(() => expect(calls.some((c) => c.name === 'addReply')).toBe(true));
    expect(calls.find((c) => c.name === 'addReply')!.args[0]).toMatchObject({
      poolId: 'p-pan',
    });
  });

  it('in a pool’s tab with none of its replies, the Reply under the ripple writes to it, opening just below (H)', async () => {
    const { container, getByRole } = asOwner();
    fireEvent.click(getByRole('tab', { name: 'Crew · 1' }));
    // Crew has no reply on `night`.
    const root = under(container, 'night');
    expect(root.querySelector('[data-reply]')).toBeNull();
    fireEvent.click(root.querySelector('[data-reply-toggle]')!);
    expect(
      root.querySelector('[data-reactions]')!.nextElementSibling!.hasAttribute('data-reply-field'),
    ).toBe(true);
    write(root, 'first in Crew');
    await waitFor(() => expect(calls.some((c) => c.name === 'addReply')).toBe(true));
    expect(calls.find((c) => c.name === 'addReply')!.args[0]).toMatchObject({
      rippleId: 'night',
      poolId: 'p-crew',
    });
  });

  it('never shows mine to me alone in a pool’s tab, nor any label (H)', () => {
    const { container, getByRole } = asOwner();
    fireEvent.click(getByRole('tab', { name: 'Pancake · 2' }));
    const ids = [...under(container, 'first').querySelectorAll('[data-reply]')].map((r) =>
      r.getAttribute('data-reply'),
    );
    expect(ids).toEqual(['r1', 'r2', 'r5']);
    expect(container.querySelector('[data-reply-thread-label]')).toBeNull();
    expect(container.querySelector('[data-ripple-thread-label]')).toBeNull();
  });
});

describe('the compact bar, once the title has scrolled away (H75)', () => {
  // The title row's visibility, driven by hand.
  let report: (out: boolean) => void = () => {};
  beforeEach(() => {
    class Watch {
      constructor(cb: IntersectionObserverCallback) {
        report = (out) =>
          act(() =>
            cb(
              [
                {
                  isIntersecting: !out,
                  boundingClientRect: { bottom: out ? -10 : 200 },
                  rootBounds: { top: 0 },
                } as unknown as IntersectionObserverEntry,
              ],
              this as unknown as IntersectionObserver,
            ),
          );
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', Watch);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is not there while the title shows; scrolled past, the emoji, the title, the chip and the menu', async () => {
    const { container } = page({ audience: <button data-audience-chip>2 pools</button> });
    expect(container.querySelector('[data-compact-bar]')).toBeNull();
    report(true);
    const bar = container.querySelector('[data-compact-bar]')!;
    expect(bar.querySelector('[data-compact-title]')!.textContent).toBe('Whistler, two nights');
    expect(bar.querySelector('[data-compact-title]')!.className).toMatch(/truncate/);
    expect(bar.textContent).toContain('📍');
    expect(bar.querySelector('[data-audience-chip]')).not.toBeNull();
    expect(bar.querySelector('[aria-label="More"]')).not.toBeNull();
    expect(bar.className).toMatch(/h-12/);
    expect(bar.className).toMatch(/bg-white/);
    // Without tabs, its own hairline.
    expect(bar.className).toMatch(/border-b/);
    // It takes no room in the flow.
    expect(bar.parentElement!.className).toMatch(/sticky top-0 .*h-0/);
    report(false);
    await waitFor(() => expect(container.querySelector('[data-compact-bar]')).toBeNull());
  });
});

describe('a splash’s description (0037)', () => {
  /** The header's `…`, then its description item. */
  function fromMenu(container: HTMLElement, which: 'add' | 'hide'): void {
    fireEvent.click(container.querySelector('[data-splash-header] [aria-label="More"]')!);
    fireEvent.click(container.querySelector(`[data-description-toggle="${which}"]`)!);
  }

  it('is hidden until Add description in the header’s menu, then saves what was written when the field is left (review)', async () => {
    const { container } = page();
    // No field and no "+ Add description" standing in the page.
    expect(container.querySelector('[data-splash-description-block]')).toBeNull();
    expect(container.textContent).not.toContain('Add description');
    fromMenu(container, 'add');
    const field = container.querySelector<HTMLTextAreaElement>('[data-splash-description-field]')!;
    // Open, in focus, its placeholder faint.
    expect(document.activeElement).toBe(field);
    expect(field.className).toContain('placeholder:opacity-30');
    fireEvent.change(field, { target: { value: '  A weekend in Whistler.  ' } });
    // Set apart from the ripples by a divider.
    expect(container.querySelector('[data-splash-description-block]')!.className).toContain(
      'border-b',
    );
    fireEvent.blur(field);
    await waitFor(() =>
      expect(calls.find((c) => c.name === 'setSplashDescription')?.args).toEqual([
        board.id,
        'A weekend in Whistler.',
      ]),
    );
  });

  it('hides an empty field again from the menu, or when left with no words', () => {
    const { container } = page();
    fromMenu(container, 'add');
    expect(container.querySelector('[data-splash-description-field]')).not.toBeNull();
    fromMenu(container, 'hide');
    expect(container.querySelector('[data-splash-description-block]')).toBeNull();
    fromMenu(container, 'add');
    fireEvent.blur(container.querySelector('[data-splash-description-field]')!);
    expect(container.querySelector('[data-splash-description-block]')).toBeNull();
    // The menu says Add again.
    fireEvent.click(container.querySelector('[data-splash-header] [aria-label="More"]')!);
    expect(container.querySelector('[data-description-toggle="add"]')).not.toBeNull();
    expect(calls.some((c) => c.name === 'setSplashDescription')).toBe(false);
  });

  it('shows one that has words, and Hide description takes it off', async () => {
    const { container } = page({
      splash: { ...summarizeSplash(board, blocks, TZ, NOW), description: 'Kept' },
    });
    expect(container.querySelector('[data-splash-description]')!.textContent).toBe('Kept');
    fromMenu(container, 'hide');
    expect(container.querySelector('[data-splash-description-block]')).toBeNull();
    await waitFor(() =>
      expect(calls.find((c) => c.name === 'setSplashDescription')?.args).toEqual([board.id, '']),
    );
  });

  it('keeps what was there on Escape, and shows nothing to a reader when there is none', () => {
    const { container, unmount } = page({
      splash: { ...summarizeSplash(board, blocks, TZ, NOW), description: 'Kept' },
    });
    fireEvent.click(container.querySelector('[data-splash-description]')!);
    const field = container.querySelector<HTMLTextAreaElement>('[data-splash-description-field]')!;
    fireEvent.change(field, { target: { value: 'Changed' } });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(container.querySelector('[data-splash-description]')!.textContent).toBe('Kept');
    expect(calls.some((c) => c.name === 'setSplashDescription')).toBe(false);
    unmount();
    const reader = page({
      pool: {
        poolId: 'p-1',
        me: 'someone-else',
        scope: 'theirs',
        initialsOf: {},
        laneChip: null,
        canDeleteJoint: false,
        zoneOf: {},
      },
    });
    expect(reader.container.querySelector('[data-splash-description-block]')).toBeNull();
    // Nor a menu item to add one.
    expect(reader.container.querySelector('[data-description-toggle]')).toBeNull();
  });
});

describe('the dot for what others left on my block (H25)', () => {
  it('goes when I tap that block’s reactions, without waiting for the next open', async () => {
    window.localStorage.clear();
    const { container } = render(
      <PeopleProvider me="a1" people={{ a1: { name: 'Yoonji', photo: null } }}>
        <InputSheetProvider>
          <SplashPage
            splash={summarizeSplash(board, blocks, TZ, NOW)}
            blocks={blocks}
            photos={{}}
            lockedIds={[]}
            categories={LANES}
            timeZone={TZ}
            today={TODAY}
            respondable
            responses={{
              reactions: [
                {
                  ripple_id: 'first',
                  user_id: 'u-friend',
                  emoji: '🙏',
                  created_at: '2026-09-25T19:00:00.000Z',
                  thread_pool_id: null,
                },
              ],
              replies: [],
            }}
          />
        </InputSheetProvider>
      </PeopleProvider>,
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-responses-unseen]')).toHaveLength(1),
    );
    fireEvent.pointerDown(
      container.querySelector('[data-ripple-responses="first"] [data-reaction]')!,
    );
    expect(container.querySelector('[data-responses-unseen]')).toBeNull();
  });
});
