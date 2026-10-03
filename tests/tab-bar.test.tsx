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
  it('is Home / Sessions / Lanes / Locker and the FAB, with no dead seat', () => {
    const { container } = bar();
    expect([...container.querySelectorAll('nav a')].map((a) => a.textContent)).toEqual([
      'Home',
      'Sessions',
      'Lanes',
      'Locker',
    ]);
    expect(container.textContent).not.toMatch(/pools|friends/i);
    expect(container.querySelectorAll('nav button')).toHaveLength(1);
    expect(container.querySelector('nav svg path[d*="M"]')).not.toBeNull();
  });

  it('opens the post sheet from the FAB, the one entry', () => {
    const { getByLabelText, container } = bar();
    fireEvent.click(getByLabelText('Drop a splash'));
    expect(container.querySelector('[data-sheet]')!.textContent).toBe('splash');
    expect(getByLabelText('Drop a splash').className).toContain('bg-main-900');
  });

  it('keeps Home lit on a post’s page and Sessions lit on a shelf', () => {
    pathname = '/splash/s1';
    let view = bar();
    expect(view.getByText('Home').closest('a')!.getAttribute('aria-current')).toBe('page');
    cleanup();

    pathname = '/sessions/ss1';
    view = bar();
    expect(view.getByText('Sessions').closest('a')!.getAttribute('aria-current')).toBe('page');
    expect(view.getByText('Home').closest('a')!.getAttribute('aria-current')).toBeNull();
  });

  it('fades an inactive tab as one item, in the chrome colour', () => {
    const { getByText } = bar();
    const lanes = getByText('Lanes').closest('a')!;
    expect(lanes.className).toContain('opacity-20');
    expect(lanes.className).toContain('text-main-900');
  });
});
