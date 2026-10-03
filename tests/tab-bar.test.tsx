// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

let pathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));

import { TabBar } from '@/components/ui/tab-bar';
import { InputSheetProvider, useInputSheet } from '@/features/input-sheet/sheet-provider';

afterEach(() => {
  cleanup();
  pathname = '/';
});

function Probe() {
  const { sheet } = useInputSheet();
  return <output data-sheet>{sheet ? sheet.kind : ''}</output>;
}

function bar() {
  return render(
    <InputSheetProvider>
      <TabBar />
      <Probe />
    </InputSheetProvider>,
  );
}

describe('the tab bar (D3, H21)', () => {
  it('is Home / Locker and the FAB, with no dead seat (review: Lanes retired, sessions are a sheet)', () => {
    const { container } = bar();
    expect([...container.querySelectorAll('nav a')].map((a) => a.textContent)).toEqual([
      'Home',
      'Locker',
    ]);
    expect(container.textContent).not.toMatch(/pools|friends|lanes|sessions/i);
    expect(container.querySelectorAll('nav button')).toHaveLength(1);
    expect(container.querySelector('nav svg path[d*="M"]')).not.toBeNull();
  });

  it('opens the post sheet from the FAB, the one entry', () => {
    const { getByLabelText, container } = bar();
    fireEvent.click(getByLabelText('Drop a splash'));
    expect(container.querySelector('[data-sheet]')!.textContent).toBe('splash');
    expect(getByLabelText('Drop a splash').className).toContain('bg-main-900');
  });

  it('keeps Home lit on a post’s page and on a shelf: both are reached from Home', () => {
    for (const where of ['/splash/s1', '/sessions/ss1']) {
      pathname = where;
      const view = bar();
      expect(view.getByText('Home').closest('a')!.getAttribute('aria-current')).toBe('page');
      expect(view.getByText('Locker').closest('a')!.getAttribute('aria-current')).toBeNull();
      cleanup();
    }
  });

  it('cuts its top corners large and overlaps the page by the radius, as the mockup draws it', () => {
    const { container } = bar();
    const nav = container.querySelector('[data-tab-bar]')!;
    expect(nav.className).toContain('rounded-t-[40px]');
    expect(nav.className).toContain('-mt-10');
    expect(nav.className).not.toMatch(/rounded-b/);
  });

  it('fades an inactive tab as one item, in the chrome colour', () => {
    const { getByText } = bar();
    const locker = getByText('Locker').closest('a')!;
    expect(locker.className).toContain('opacity-20');
    expect(locker.className).toContain('text-main-900');
  });
});
