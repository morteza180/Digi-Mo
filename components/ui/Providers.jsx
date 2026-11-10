'use client';

import { createContext, useMemo } from 'react';
import { useStore } from '@/hooks/useStore';
import { mergeCollection } from '@/services/dataService';
import { mergeSettings } from '@/services/settingsService';

export const DataContext = createContext(null);

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export default function Providers({ categories, settings, children }) {
  const [catOverlay, , catReady] = useStore('categories', {});
  const [setOverlay, , setReady] = useStore('settings', {});

  // رندر اول = داده‌ی سرور (overlay خالی)، پس Hydration Mismatch نداریم
  const value = useMemo(
    () => ({
      base: { categories, settings },
      categories: mergeCollection(categories, catOverlay).sort(byOrder),
      settings: mergeSettings(settings, setOverlay),
      ready: catReady && setReady,
    }),
    [categories, settings, catOverlay, setOverlay, catReady, setReady]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}