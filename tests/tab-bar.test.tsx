// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let pathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));

import { TabBar } from '@/components/ui/tab-bar';
import { buildFlow, monthSections } from '@/features/home/flow';
import { HomeFlow } from '@/features/home/home-flow';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import type { RippleWithCategory } from '@/lib/queries/ripples';

const TZ = 'America/Vancouver';

beforeEach(() => {
  pathname = '/';
  window.sessionStorage.clear();
  window.scrollBy = () => {};
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

const RIPPLE: RippleWithCategory = {
  id: 'r1',
  author_id: 'a1',
  category_id: 'c-place',
  note: 'kitsilano beach',
  media: [],
  occurred_on: null,
  occurred_time: null,
  started_at: null,
  ended_at: null,
  planned: false,
  participants: [],
  created_at: '2026-09-25T16:00:00.000Z',
  parent_ripple_id: null,
  splash_id: null,
  category: { name: 'Place', icon: '📍' },
};

/** The shell as the page sees it: Home under the bar, one provider. */
function shell() {
  return render(
    <InputSheetProvider>
      <HomeFlow
        sections={monthSections(buildFlow([RIPPLE], [], TZ), TZ)}
        splashes={[]}
        categories={[]}
        thumbnails={{}}
        timeZone={TZ}
        today="2026-09-25"
      />
      <TabBar />
    </InputSheetProvider>,
  );
}

const modeOf = (container: HTMLElement): string | null =>
  container.querySelector('[data-home-mode]')!.getAttribute('data-home-mode');

/**
 * Whether the bar handled the click before it reached the link. Read at the
 * document, after React's root handler has run, then swallowed so jsdom does
 * not try to leave the page.
 */
function clickAndAsk(anchor: HTMLAnchorElement): boolean {
  let handled = false;
  const witness = (event: Event): void => {
    handled = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', witness);
  fireEvent.click(anchor);
  document.removeEventListener('click', witness);
  return handled;
}

describe('the Home tab re-tapped (SPEC 5)', () => {
  it('flips the view mode while already on Home, without navigating', () => {
    const { container, getByText } = shell();
    const home = getByText('Home').closest('a')!;
    expect(home.getAttribute('aria-current')).toBe('page');
    expect(modeOf(container)).toBe('splash');

    const rows = [...container.querySelectorAll('[data-flow-id]')];
    // A handled click: the link did not navigate.
    expect(clickAndAsk(home)).toBe(true);
    expect(modeOf(container)).toBe('ripple');

    expect(clickAndAsk(home)).toBe(true);
    expect(modeOf(container)).toBe('splash');
    // A refocus: the rows kept their nodes.
    [...container.querySelectorAll('[data-flow-id]')].forEach((node, index) =>
      expect(node).toBe(rows[index]),
    );
  });

  it('still navigates to Home from anywhere else', () => {
    for (const elsewhere of ['/lanes', '/locker', '/splash/s1']) {
      pathname = elsewhere;
      const { container, getByText } = shell();
      const home = getByText('Home').closest('a')!;
      expect(home.getAttribute('href')).toBe('/');

      // Not intercepted: the click is the link's to handle, and the mode
      // on the page underneath is untouched.
      expect(clickAndAsk(home)).toBe(false);
      expect(modeOf(container)).toBe('splash');
      cleanup();
    }
  });

  it('flips only the mode, never the other tabs', () => {
    const { container, getByText } = shell();
    expect(clickAndAsk(getByText('Lanes').closest('a')!)).toBe(false);
    expect(modeOf(container)).toBe('splash');
  });
});
