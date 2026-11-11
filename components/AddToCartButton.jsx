'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { MAX_QTY } from '@/lib/constants';
import { formatNumber } from '@/lib/format';

export default function AddToCartButton({ product, color = null }) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const out = product.stock <= 0;
  const max = Math.max(1, Math.min(MAX_QTY, product.stock));
  const safeQty = Math.min(qty, max); // اگه ادمین موجودی رو کم کرد

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 3000);
    return () => clearTimeout(t);
  }, [added]);

  const onAdd = () => {
    cart.add(product.id, safeQty, color);
    setAdded(true);
  };

  if (out) {
    return <button type="button" disabled className="btn-outline w-full">ناموجود</button>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-slate-300 bg-white" role="group" aria-label="تعداد">
          <button
            type="button"
            className="h-11 w-11 text-xl disabled:opacity-30"
            onClick={() => setQty(Math.max(1, safeQty - 1))}
            disabled={safeQty <= 1}
            aria-label="کاهش تعداد"
          >
            −
          </button>
          <span className="w-10 text-center font-medium" aria-live="polite">{formatNumber(safeQty)}</span>
          <button
            type="button"
            className="h-11 w-11 text-xl disabled:opacity-30"
            onClick={() => setQty(Math.min(max, safeQty + 1))}
            disabled={safeQty >= max}
            aria-label="افزایش تعداد"
          >
            +
          </button>
        </div>
        <button type="button" onClick={onAdd} className="btn-primary h-11 flex-1">
          افزودن به سبد خرید
        </button>
      </div>

      <p className="min-h-5 text-sm text-firouzeh-dark" role="status" aria-live="polite">
        {added && (
          <>
            ✓ به سبد خرید اضافه شد.{' '}
            <Link href="/cart" className="font-medium underline">مشاهده سبد</Link>
          </>
        )}
      </p>
    </div>
  );
}