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

import type { Session } from '@/features/sessions/shelves';
import { SHEET_MAX_HEIGHT, SplashSheet } from '@/features/splash-sheet/splash-sheet';
import { splitTitle } from '@/features/splash-sheet/split-title';
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
const TRIPS: Session = {
  id: 'ss1',
  owner_id: 'a1',
  kind: 'custom',
  title: 'Trips',
  month: null,
  declared_start: null,
  declared_end: null,
  lane_id: null,
  created_at: '2026-09-01T00:00:00Z',
};

beforeEach(() => {
  drops.length = 0;
  window.URL.createObjectURL = () => 'blob:preview';
});
afterEach(cleanup);

function sheet(onCommitted = vi.fn()) {
  const view = render(
    <SplashSheet
      context={{ categories: LANES, sessions: [TRIPS], timeZone: TZ, today: TODAY }}
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
  });

  it('commits a single line with no Enter as an untitled post whose line is its block', async () => {
    const view = sheet();
    expect(view.drop().disabled).toBe(true);
    fireEvent.change(view.getByLabelText('Your splash'), { target: { value: 'coffee went cold' } });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({
      title: '',
      body: 'coffee went cold',
      declaredLaneId: null,
      sessionId: null,
    });
    expect(view.onCommitted).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's-new' }),
      '2026-09',
    );
  });

  it('commits the first line as the title and the rest as the first block', async () => {
    const view = sheet();
    fireEvent.change(view.getByLabelText('Your splash'), {
      target: { value: 'Whistler\nsea to sky\n\nfog the whole way' },
    });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({ title: 'Whistler', body: 'sea to sky\n\nfog the whole way' });
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
    fireEvent.change(view.getByLabelText('Your splash'), { target: { value: 'a' } });
    fireEvent.click(view.getByText('+ Add Time'));
    fireEvent.change(view.getByLabelText('Date'), { target: { value: '2026-08-17' } });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({ occurredOn: '2026-08-17', occurredTime: null });
    expect(view.onCommitted).toHaveBeenCalledWith(expect.anything(), '2026-08');
  });

  it('shelves the post on a custom session from the picker, and takes it off again', async () => {
    const view = sheet();
    fireEvent.click(view.getByText('+ Add to Session'));
    fireEvent.click(view.getByText('Trips'));
    expect(view.container.querySelector('[data-session-chip]')!.textContent).toContain('Trips');
    fireEvent.change(view.getByLabelText('Your splash'), { target: { value: 'a' } });
    fireEvent.click(view.drop());
    await waitFor(() => expect(drops).toHaveLength(1));
    expect(drops[0]).toMatchObject({ sessionId: 'ss1' });

    fireEvent.click(view.getByLabelText('Remove from session'));
    expect(view.container.querySelector('[data-session-chip]')).toBeNull();
    expect(view.getByText('+ Add to Session')).toBeTruthy();
  });

  it('offers + Add Image', () => {
    const { getByText, container } = sheet();
    expect(getByText('+ Add Image')).toBeTruthy();
    expect(container.querySelector('[data-media-input]')).not.toBeNull();
  });
});
