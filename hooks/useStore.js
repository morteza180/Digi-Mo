'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readStore, writeStore, STORE_KEYS } from '@/services/dataService';

/**
 * const [cart, setCart, ready] = useStore('cart', []);
 * - رندر اول همیشه fallback است (هماهنگ با خروجی سرور = بدون Hydration Error)
 * - ready وقتی true میشه که داده‌ی localStorage خونده شده (برای نمایش اسکلتون)
 */
export function useStore(key, fallback) {
  const fallbackRef = useRef(fallback);
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setValue(readStore(key, fallbackRef.current));
    const onLocal = (e) => e.detail === key && load();
    const onStorage = (e) => (e.key === null || e.key === STORE_KEYS[key]) && load();

    load();
    setReady(true);
    window.addEventListener('digimo:store', onLocal); // همین تب
    window.addEventListener('storage', onStorage);    // تب‌های دیگه
    return () => {
      window.removeEventListener('digimo:store', onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  const update = useCallback(
    (next) => {
      const current = readStore(key, fallbackRef.current);
      writeStore(key, typeof next === 'function' ? next(current) : next);
    },
    [key]
  );

  return [value, update, ready];
}