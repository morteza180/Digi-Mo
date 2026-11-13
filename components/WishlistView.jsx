'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/hooks/useCart';
import { useStore } from '@/hooks/useStore';
import { useWishlist } from '@/hooks/useLists';
import { mergeCollection } from '@/services/dataService';
import { formatNumber } from '@/lib/format';

export default function WishlistView({ products }) {
  const wish = useWishlist();
  const cart = useCart();
  const [overlay, , overlayReady] = useStore('products', {});
  const [added, setAdded] = useState(0);

  const all = useMemo(() => mergeCollection(products, overlay), [products, overlay]);

  // idهایی که دیگر کالایشان وجود ندارد (مثلاً ادمین حذف کرده) نباید خراب‌کاری کنند
  const items = useMemo(
    () => wish.ids.map((id) => all.find((p) => p.id === id)).filter(Boolean),
    [wish.ids, all]
  );
  const staleIds = useMemo(
    () => wish.ids.filter((id) => !all.some((p) => p.id === id)),
    [wish.ids, all]
  );
  const available = items.filter((p) => p.stock > 0);

  const addAll = () => {
    available.forEach((p) => cart.add(p.id, 1, p.colors?.[0]?.name ?? null));
    setAdded(available.length);
  };

  if (!wish.ready || !overlayReady) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="card h-72 animate-pulse bg-slate-100" />)}
      </div>
    );
  }

  if (items.length === 0 && staleIds.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-6xl" aria-hidden="true">🤍</p>
        <h2 className="mt-4 text-lg font-bold">هنوز کالایی ذخیره نکرده‌ای</h2>
        <p className="mt-1 text-sm text-slate-500">روی آیکون قلب کارت هر محصول بزن تا اینجا ذخیره شود.</p>
        <Link href="/products" className="btn-primary mt-6">مشاهده محصولات</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{formatNumber(items.length)} کالا ذخیره شده</p>
        {available.length > 0 && (
          <button type="button" onClick={addAll} className="btn-primary">
            افزودن همه‌ی کالاهای موجود به سبد ({formatNumber(available.length)})
          </button>
        )}
      </div>

      {added > 0 && (
        <p className="rounded-xl bg-firouzeh/10 p-3 text-sm text-firouzeh-dark" role="status">
          ✓ {formatNumber(added)} کالا به سبد اضافه شد.{' '}
          <Link href="/cart" className="font-medium underline">مشاهده سبد</Link>
        </p>
      )}

      {staleIds.length > 0 && (
        <p className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">
          {formatNumber(staleIds.length)} کالای ذخیره‌شده دیگر در فروشگاه موجود نیست.
          <button
            type="button"
            className="font-medium underline"
            onClick={() => staleIds.forEach((id) => wish.toggle(id))}
          >
            حذف از لیست
          </button>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}