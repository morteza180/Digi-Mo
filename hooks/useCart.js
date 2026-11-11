'use client';

import { useCallback, useMemo } from 'react';
import { useStore } from './useStore';
import { MAX_QTY } from '@/lib/constants';

const same = (item, id, color) => item.id === id && (item.color ?? null) === (color ?? null);

export function useCart() {
  const [items, setItems, ready] = useStore('cart', []);

  const add = useCallback(
    (id, qty = 1, color = null) =>
      setItems((cur) => {
        if (cur.some((i) => same(i, id, color))) {
          return cur.map((i) =>
            same(i, id, color) ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i
          );
        }
        return [...cur, { id, qty: Math.min(MAX_QTY, qty), color: color ?? null }];
      }),
    [setItems]
  );

  const setQty = useCallback(
    (id, qty, color = null) =>
      setItems((cur) =>
        qty <= 0
          ? cur.filter((i) => !same(i, id, color))
          : cur.map((i) => (same(i, id, color) ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))
      ),
    [setItems]
  );

  const remove = useCallback(
    (id, color = null) => setItems((cur) => cur.filter((i) => !same(i, id, color))),
    [setItems]
  );

  const clear = useCallback(() => setItems([]), [setItems]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const has = useCallback((id) => items.some((i) => i.id === id), [items]);

  return { items, count, ready, add, setQty, remove, clear, has };
}