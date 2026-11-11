'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from './useStore';
import { MAX_COMPARE } from '@/lib/constants';

const asMap = (v) => (v && !Array.isArray(v) ? v : {});

export function useWishlist() {
  const [raw, setRaw, ready] = useStore('wishlist', {});
  const [user] = useStore('session', null);
  const router = useRouter();

  const ids = user ? (asMap(raw)[user.id] ?? []) : [];
  const has = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id) => {
      if (!user) {
        // مقصد بعد از ورود: همین صفحه، با query
        const here = window.location.pathname + window.location.search;
        router.push(`/login?next=${encodeURIComponent(here)}`);
        return;
      }
      setRaw((cur) => {
        const map = asMap(cur);
        const list = map[user.id] ?? [];
        return {
          ...map,
          [user.id]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
        };
      });
    },
    [user, router, setRaw]
  );

  return { ids, ready, has, toggle, loggedIn: Boolean(user) };
}

export function useCompare() {
  const [ids, setIds, ready] = useStore('compare', []);
  const has = useCallback((id) => ids.includes(id), [ids]);
  const full = ids.length >= MAX_COMPARE;
  const toggle = useCallback(
    (id) =>
      setIds((cur) => {
        if (cur.includes(id)) return cur.filter((x) => x !== id);
        return cur.length >= MAX_COMPARE ? cur : [...cur, id];
      }),
    [setIds]
  );
  const clear = useCallback(() => setIds([]), [setIds]);
  return { ids, ready, has, full, toggle, clear };
}