// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const created: Record<string, unknown>[] = [];
vi.mock('@/features/splash/actions', () => ({
  createSplash: (input: Record<string, unknown>) => {
    created.push(input);
    return Promise.resolve({
      ok: true,
      splash: { id: 's-new', title: input.title, lane_ids: input.laneIds },
    });
  },
}));

import { SplashSheet } from '@/features/splash/splash-sheet';
import type { MyCategory } from '@/lib/queries/profile';

const TODAY = '2026-09-25';

function category(over: Partial<MyCategory>): MyCategory {
  return {
    id: 'c-place',
    user_id: 'a1',
    name: 'Place',
    icon: '📍',
    default_mode: 'drop',
    position: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

const LANES = [category({}), category({ id: 'c-mood', name: 'Mood', icon: '🌤️' })];

beforeEach(() => {
  created.length = 0;
});
afterEach(cleanup);

function sheet(onCreated: (splash: unknown) => void = () => {}) {
  return render(
    <SplashSheet categories={LANES} today={TODAY} onClose={() => {}} onCreated={onCreated} />,
  );
}

describe('the splash sheet (SPEC 6)', () => {
  it('needs a title, and commits with the same verb as a ripple', async () => {
    const onCreated = vi.fn();
    const view = sheet(onCreated);
    const drop = view.getByText('Drop') as HTMLButtonElement;
    expect(drop.disabled).toBe(true);

    fireEvent.change(view.getByPlaceholderText('Drop your splash'), {
      target: { value: 'Whistler, two nights' },
    });
    expect(drop.disabled).toBe(false);
    fireEvent.click(drop);

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      title: 'Whistler, two nights',
      laneIds: [],
      declaredStart: null,
      declaredEnd: null,
    });
    // The host opens the ripple sheet preset to the new board from here.
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 's-new' }));
  });

  it('declares several lanes, selected in ink (H20e, H20f)', async () => {
    const view = sheet();
    fireEvent.click(view.getByText('Place'));
    fireEvent.click(view.getByText('Mood'));
    expect(view.getByText('Place').closest('button')!.className).toContain('bg-ink');

    fireEvent.change(view.getByPlaceholderText('Drop your splash'), {
      target: { value: 'Kitchen' },
    });
    fireEvent.click(view.getByText('Drop'));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({ laneIds: ['c-place', 'c-mood'] });
  });

  it('declares a date range as one removable chip, descriptive only', async () => {
    const view = sheet();
    fireEvent.click(view.getByText('+ Add Date'));
    fireEvent.change(view.getByLabelText('Start date'), { target: { value: '2026-08-17' } });
    fireEvent.change(view.getByLabelText('End date'), { target: { value: '2026-08-20' } });
    fireEvent.click(view.getByText('Done'));
    expect(view.container.querySelector('[data-range-chip]')!.textContent).toContain(
      '2026-08-17 ~ 2026-08-20',
    );

    fireEvent.change(view.getByPlaceholderText('Drop your splash'), {
      target: { value: 'Whistler' },
    });
    fireEvent.click(view.getByText('Drop'));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({ declaredStart: '2026-08-17', declaredEnd: '2026-08-20' });
  });

  it('refuses an end before its start', () => {
    const view = sheet();
    fireEvent.click(view.getByText('+ Add Date'));
    fireEvent.change(view.getByLabelText('Start date'), { target: { value: '2026-08-20' } });
    fireEvent.change(view.getByLabelText('End date'), { target: { value: '2026-08-17' } });
    expect(view.getByText('ends before it starts')).toBeTruthy();
    expect((view.getByText('Done') as HTMLButtonElement).disabled).toBe(true);
  });
});
