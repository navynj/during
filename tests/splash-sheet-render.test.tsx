// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const drops: Record<string, unknown>[] = [];
vi.mock('@/features/splash/actions', () => ({
  dropSplash: (input: Record<string, unknown>) => {
    drops.push(input);
    return Promise.resolve({ ok: true, splash: { id: 's-new', title: input.title } });
  },
}));
let pathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));
vi.mock('@/lib/downscale', () => ({ downscale: (file: File) => Promise.resolve(file) }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'a1' } } }) },
    storage: { from: () => ({ upload: () => Promise.resolve({ error: null }) }) },
  }),
}));

import {
  SHEET_MAX_HEIGHT,
  SplashSheet,
  type DropHandoff,
} from '@/features/splash-sheet/splash-sheet';
import type { SplashSummary } from '@/features/splash/summary';
import { ComposerPanel } from '@/features/input-sheet/sheet-host';
import { RecentBlocks } from '@/features/splash/recent-blocks';
import { recentItems } from '@/features/splash/recent';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import { composeDrop, splitTitle } from '@/features/splash-sheet/split-title';
import type { MyCategory } from '@/lib/queries/profile';

const TZ = 'America/Vancouver';
const TODAY = '2026-09-25';

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
  lane('c-mood', 'Mood', '🌤️', 1),
  lane('c-day', 'Day', '🖋', 2),
];

beforeEach(() => {
  drops.length = 0;
  handoffs.length = 0;
  window.URL.createObjectURL = () => 'blob:preview';
});
afterEach(cleanup);

/** The handoffs the sheet made: the post as the ground should show it, and its month. */
const handoffs: { splash: SplashSummary; month: string }[] = [];

function sheet() {
  const onDrop = vi.fn((drop: DropHandoff) => {
    handoffs.push({ splash: drop.splash, month: drop.month });
    void drop.commit();
  });
  const view = render(
    <SplashSheet
      context={{ categories: LANES, timeZone: TZ, today: TODAY }}
      onClose={() => {}}
      onDrop={onDrop}
    />,
  );
  return { ...view, onDrop, drop: () => view.getByText('Drop') as HTMLButtonElement };
}

describe('the first line is the title (SPEC 6)', () => {
  it('splits at the first Enter, and a single line is untitled', () => {
    expect(splitTitle('Whistler\nsea to sky\nfog the whole way')).toEqual({
      title: 'Whistler',
      body: 'sea to sky\nfog the whole way',
    });
    expect(splitTitle('coffee went cold')).toEqual({ title: '', body: 'coffee went cold' });
    expect(splitTitle('Just a title\n')).toEqual({ title: 'Just a title', body: '' });
    // Across the two fields: a line in the title alone is still the dump.
    expect(composeDrop('coffee went cold', '', false)).toEqual({
      title: '',
      body: 'coffee went cold',
    });
    expect(composeDrop('Whistler', 'sea to sky', false)).toEqual({
      title: 'Whistler',
      body: 'sea to sky',
    });
    expect(composeDrop('A photo day', '', true)).toEqual({ title: 'A photo day', body: '' });
  });

  it('commits a single line with no Enter as an untitled post whose line is its block', async () => {
    const view = sheet();
    expect(view.drop().disabled).toBe(true);
    fireEvent.change(view.getByLabelText('Title'), { target: { value: 'coffee went cold' } });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({
      title: '',
      body: 'coffee went cold',
      declaredLaneId: null,
      sessionId: null,
      // Today is in the field from the start: a date, no clock.
      occurredOn: TODAY,
      occurredTime: null,
    });
    // Handed over at once, the post as the ground should show it: a real id,
    // an untitled post of one block resting on today.
    expect(handoffs).toHaveLength(1);
    expect(handoffs[0].month).toBe('2026-09');
    expect(handoffs[0].splash).toMatchObject({ title: '', count: 1, orphan: false });
    expect(handoffs[0].splash.ghostTitle).toBe('coffee went cold');
    expect(handoffs[0].splash.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(drops[0]).toMatchObject({ id: handoffs[0].splash.id });
  });

  it('commits the title field as the title and the body field as the first block', async () => {
    const view = sheet();
    fireEvent.change(view.getByLabelText('Title'), { target: { value: 'Whistler' } });
    fireEvent.change(view.getByLabelText('Content'), {
      target: { value: 'sea to sky\n\nfog the whole way' },
    });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({ title: 'Whistler', body: 'sea to sky\n\nfog the whole way' });
  });

  it('is two fields in one voice: the title large and bold, the content smaller and lighter', () => {
    const { container } = sheet();
    const title = container.querySelector<HTMLTextAreaElement>('[data-sheet-title]')!;
    const body = container.querySelector<HTMLTextAreaElement>('[data-sheet-body]')!;
    expect(title.placeholder).toBe('Drop your splash');
    expect(body.placeholder).toBe('Enter the content');
    expect(title.className).toContain('text-3xl');
    expect(title.className).toContain('font-semibold');
    expect(title.className).toContain('text-main-900');
    expect(body.className).toContain('text-base');
    expect(body.className).toContain('font-light');
    expect(title.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('moves from the title to the content on Enter: the first line stays the title', () => {
    const { container } = sheet();
    const title = container.querySelector<HTMLTextAreaElement>('[data-sheet-title]')!;
    const body = container.querySelector<HTMLTextAreaElement>('[data-sheet-body]')!;
    title.focus();
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(document.activeElement).toBe(body);
    fireEvent.change(title, { target: { value: 'two\nlines' } });
    expect(title.value).toBe('twolines');
  });

  it('stays in the title while an IME is composing: that Enter commits the character', () => {
    const { container } = sheet();
    const title = container.querySelector<HTMLTextAreaElement>('[data-sheet-title]')!;
    title.focus();
    fireEvent.keyDown(title, { key: 'Enter', isComposing: true });
    expect(document.activeElement).toBe(title);
    fireEvent.keyDown(title, { key: 'Enter', keyCode: 229 });
    expect(document.activeElement).toBe(title);
  });

  it('walks back to the end of the title on Backspace at the start of the content', () => {
    const { container } = sheet();
    const title = container.querySelector<HTMLTextAreaElement>('[data-sheet-title]')!;
    const body = container.querySelector<HTMLTextAreaElement>('[data-sheet-body]')!;
    fireEvent.change(title, { target: { value: 'Whistler' } });
    fireEvent.change(body, { target: { value: 'sea to sky' } });
    body.focus();
    body.setSelectionRange(0, 0);
    fireEvent.keyDown(body, { key: 'Backspace' });
    expect(document.activeElement).toBe(title);
    expect(title.selectionStart).toBe('Whistler'.length);
    expect(body.value).toBe('sea to sky');

    // Anywhere else in the body, Backspace is Backspace.
    body.focus();
    body.setSelectionRange(3, 3);
    fireEvent.keyDown(body, { key: 'Backspace' });
    expect(document.activeElement).toBe(body);
  });

  it('opens with today in the field, a date and no clock, removable for a plain block', async () => {
    const view = sheet();
    expect((view.getByLabelText('Date') as HTMLInputElement).value).toBe(TODAY);
    expect(view.queryByText('+ Add Time')).toBeNull();
    fireEvent.click(view.getByLabelText('Remove the time'));
    expect(view.getByText('+ Add Time')).toBeTruthy();
    fireEvent.change(view.getByLabelText('Content'), { target: { value: 'a' } });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({ occurredOn: null });
  });
});

describe('the sheet’s shape', () => {
  it('is one white sheet on the dimmed ground, capped near fullscreen by the safe area', () => {
    const { container, getByRole } = sheet();
    const dialog = getByRole('dialog');
    expect(dialog.className).toContain(SHEET_MAX_HEIGHT);
    expect(SHEET_MAX_HEIGHT).toMatch(/100dvh/);
    expect(SHEET_MAX_HEIGHT).toMatch(/safe-area-inset-top/);
    expect(dialog.className).toContain('bg-white');
    expect(container.querySelector('[aria-label="Close"]')!.className).toContain('bg-main-900/60');
    expect(getByRole('dialog').querySelector('textarea')!.getAttribute('placeholder')).toBe(
      'Drop your splash',
    );
  });

  it('fills the selected lane chip with ink, never blue, and declares it (H20f, H21f)', async () => {
    const view = sheet();
    fireEvent.click(view.getByText('Place'));
    expect(view.getByText('Place').className).toContain('bg-ink');
    expect(view.getByText('Place').className).not.toContain('bg-main-900');
    // A chip alone is a valid post: the zero-character diary (E1).
    expect(view.drop().disabled).toBe(false);
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({ declaredLaneId: 'c-place', body: '' });
  });

  it('has no Timer, no audience chip, no mode toggle, no Add to Splash', () => {
    const { queryByText, queryByRole } = sheet();
    expect(queryByText('Timer')).toBeNull();
    expect(queryByText(/everyone|only me/i)).toBeNull();
    expect(queryByRole('group', { name: 'View' })).toBeNull();
    expect(queryByText('+ Add to Splash')).toBeNull();
  });
});

describe('the affordances under the text', () => {
  it('annotates the first block, and the ground scopes to that month on commit', async () => {
    const view = sheet();
    fireEvent.change(view.getByLabelText('Content'), { target: { value: 'a' } });
    fireEvent.change(view.getByLabelText('Date'), { target: { value: '2026-08-17' } });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({ occurredOn: '2026-08-17', occurredTime: null });
    expect(handoffs[0].month).toBe('2026-08');
  });

  it('has no session field: sessions are date-based, a post is shelved by its dates', () => {
    const { queryByText, container } = sheet();
    expect(queryByText('+ Add to Session')).toBeNull();
    expect(container.querySelector('[data-session-chip]')).toBeNull();
  });

  it('offers + Add Image', () => {
    const { getByText, container } = sheet();
    expect(getByText('+ Add Image')).toBeTruthy();
    expect(container.querySelector('[data-media-input]')).not.toBeNull();
  });
});

describe('the wide screen’s standing composer (review)', () => {
  const context = { categories: LANES, timeZone: TZ, today: TODAY };
  const panel = () =>
    render(
      <InputSheetProvider>
        <ComposerPanel context={context} />
      </InputSheetProvider>,
    );

  it('floats on the water on Home, with Drop your splash waiting', () => {
    pathname = '/';
    const { container } = panel();
    const aside = container.querySelector('[data-composer-panel]')!;
    expect(aside.className).toContain('water-ground');
    expect(aside.className).toContain('lg:w-1/2');
    expect(aside.querySelector('[data-splash-composer]')).not.toBeNull();
    expect(aside.querySelector('[data-sheet-title]')!.getAttribute('placeholder')).toBe(
      'Drop your splash',
    );
  });

  it('sits on the page elsewhere, and is absent on a post’s page: the blocks take the right half', () => {
    pathname = '/locker';
    let view = panel();
    expect(view.container.querySelector('[data-composer-panel]')!.className).toContain(
      'bg-pool-100',
    );
    expect(view.container.querySelector('[data-composer-panel]')!.className).not.toContain(
      'water-ground',
    );
    cleanup();

    pathname = '/splash/s1';
    view = panel();
    expect(view.container.querySelector('[data-composer-panel]')).toBeNull();
    pathname = '/';
  });
});

describe('the recent column under the composer (review)', () => {
  const ripple = (over: Partial<RippleWithCategory> & { id: string }): RippleWithCategory => ({
    author_id: 'a1',
    category_id: 'c-day',
    note: 'words',
    media: [],
    occurred_on: null,
    occurred_time: null,
    started_at: null,
    ended_at: null,
    planned: false,
    participants: [],
    created_at: '2026-09-25T16:00:00.000Z',
    parent_ripple_id: null,
    splash_id: 's1',
    category: { name: 'Day', icon: '🖋' },
    splash: { declared_start: null, title: 'Whistler' },
    ...over,
  });

  it('reads newest day first, newest posted first within a day, under the posts’ titles', () => {
    const items = recentItems(
      [
        ripple({ id: 'old-day', occurred_on: '2026-09-20', created_at: '2026-09-25T18:00:00Z' }),
        ripple({ id: 'early', created_at: '2026-09-25T10:00:00Z' }),
        ripple({ id: 'late', created_at: '2026-09-25T15:00:00Z', note: 'the later words' }),
        ripple({ id: 'lone', splash_id: null, splash: null, created_at: '2026-09-24T15:00:00Z' }),
      ],
      TZ,
    );
    expect(items.map((i) => i.id)).toEqual(['late', 'early', 'lone', 'old-day']);
    expect(items[0]).toMatchObject({ title: 'Whistler', note: 'the later words', splashId: 's1' });
    expect(items[2]).toMatchObject({ title: '', splashId: 'lone' });

    const { container } = render(
      <InputSheetProvider>
        <RecentBlocks items={items} today={TODAY} />
      </InputSheetProvider>,
    );
    const titles = [...container.querySelectorAll('[data-recent-title]')];
    expect(titles[0].className).toContain('text-xl');
    expect(titles[0].className).toContain('font-semibold');
    expect(container.querySelector('[data-recent-preview]')!.className).toContain('line-clamp-3');
    expect([...container.querySelectorAll('[data-recent-day]')].map((d) => d.textContent)).toEqual([
      'Today',
      'Sep 24',
      'Sep 20',
    ]);
    expect(container.querySelector('[data-recent-block="late"] a')!.getAttribute('href')).toBe(
      '/splash/s1?from=2026-09',
    );
  });

  it('stands under the composer on the panel', () => {
    pathname = '/';
    const { container } = render(
      <InputSheetProvider>
        <ComposerPanel
          context={{ categories: LANES, timeZone: TZ, today: TODAY }}
          recent={recentItems([ripple({ id: 'r' })], TZ)}
        />
      </InputSheetProvider>,
    );
    const composer = container.querySelector('[data-splash-composer]')!;
    const column = container.querySelector('[data-recent-blocks]')!;
    expect(
      composer.compareDocumentPosition(column) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
