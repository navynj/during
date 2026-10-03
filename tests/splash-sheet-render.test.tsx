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
vi.mock('@/lib/downscale', () => ({ downscale: (file: File) => Promise.resolve(file) }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'a1' } } }) },
    storage: { from: () => ({ upload: () => Promise.resolve({ error: null }) }) },
  }),
}));

import { SHEET_MAX_HEIGHT, SplashSheet } from '@/features/splash-sheet/splash-sheet';
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
  window.URL.createObjectURL = () => 'blob:preview';
});
afterEach(cleanup);

function sheet(onCommitted = vi.fn()) {
  const view = render(
    <SplashSheet
      context={{ categories: LANES, timeZone: TZ, today: TODAY }}
      onClose={() => {}}
      onCommitted={onCommitted}
    />,
  );
  return { ...view, onCommitted, drop: () => view.getByText('Drop') as HTMLButtonElement };
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
    expect(view.onCommitted).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's-new' }),
      '2026-09',
    );
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
    expect(title.className).toContain('text-2xl');
    expect(title.className).toContain('font-semibold');
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
    expect(view.onCommitted).toHaveBeenCalledWith(expect.anything(), '2026-08');
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
