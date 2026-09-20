'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Prefill } from './draft';

type SheetState = { open: boolean; prefill: Prefill };

type SheetApi = SheetState & {
  /** E6: three entry points, one sheet, differing only in prefill. */
  openSheet: (prefill?: Prefill) => void;
  closeSheet: () => void;
};

const Context = createContext<SheetApi | null>(null);

export function InputSheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>({ open: false, prefill: {} });
  const router = useRouter();
  const pathname = usePathname();

  const openSheet = useCallback(
    (prefill: Prefill = {}) => {
      // The sheet lives on Home, where its landing rail has a day to draw.
      // From anywhere else the FAB goes there first rather than doing nothing.
      if (pathname !== '/') router.push('/');
      setState({ open: true, prefill });
    },
    [pathname, router],
  );

  const closeSheet = useCallback(() => setState({ open: false, prefill: {} }), []);

  const value = useMemo(
    () => ({ ...state, openSheet, closeSheet }),
    [state, openSheet, closeSheet],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInputSheet(): SheetApi {
  const api = useContext(Context);
  if (!api) throw new Error('useInputSheet must be used inside InputSheetProvider');
  return api;
}
