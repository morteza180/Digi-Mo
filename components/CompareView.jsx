'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useCompare } from '@/hooks/useLists';
import { useStore } from '@/hooks/useStore';
import { mergeCollection } from '@/services/dataService';
import { bestIndexes, formatSpec } from '@/lib/specs';
import { calcFinalPrice, formatNumber, formatPrice } from '@/lib/format';
import { useCategories } from '@/hooks/useCatalog';


const BEST = 'bg-green-50 font-bold text-green-700';

function Skeleton() {
  return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;
}

export default function CompareView({ products }) {
  const categories = useCategories();  const cmp = useCompare();
  const cart = useCart();
  const [overlay, , overlayReady] = useStore('products', {});
  const [activeCat, setActiveCat] = useState(null);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const all = useMemo(() => mergeCollection(products, overlay), [products, overlay]);

  const selected = useMemo(
    () => cmp.ids.map((id) => all.find((p) => p.id === id)).filter(Boolean),
    [cmp.ids, all]
  );
  const staleIds = useMemo(
    () => cmp.ids.filter((id) => !all.some((p) => p.id === id)),
    [cmp.ids, all]
  );

  // گروه‌بندی بر اساس دسته
  const groups = useMemo(() => {
    const map = new Map();
    selected.forEach((p) => map.set(p.category, [...(map.get(p.category) ?? []), p]));
    return [...map.entries()].map(([slug, items]) => ({
      slug,
      items,
      category: categories.find((c) => c.slug === slug) ?? null,
    }));
  }, [selected, categories]);

  const group =
    groups.find((g) => g.slug === activeCat) ?? groups.find((g) => g.items.length >= 2) ?? groups[0];

  if (!cmp.ready || !overlayReady) return <Skeleton />;

  if (selected.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-6xl" aria-hidden="true">⚖️</p>
        <h2 className="mt-4 text-lg font-bold">کالایی برای مقایسه انتخاب نشده</h2>
        <p className="mt-1 text-sm text-slate-500">روی آیکون ترازوی کارت محصولات بزن (تا ۴ کالا).</p>
        <Link href="/products" className="btn-primary mt-6">مشاهده محصولات</Link>
      </div>
    );
  }

  const items = group.items;
  const schema = group.category?.specSchema ?? [];
  const finals = items.map((p) => calcFinalPrice(p.price, p.discount));

  const rows = [
    {
      key: 'price',
      label: 'قیمت نهایی',
      cells: finals.map((f) => formatPrice(f)),
      best: bestIndexes(finals, 'lower'),
    },
    {
      key: 'rating',
      label: 'امتیاز کاربران',
      cells: items.map((p) => `⭐ ${formatNumber(p.rating)}`),
      best: bestIndexes(items.map((p) => p.rating), 'higher'),
    },
    ...schema
      .filter((s) => items.some((p) => p.specs?.[s.key] != null))
      .map((s) => {
        const vals = items.map((p) => p.specs?.[s.key] ?? null);
        return { key: s.key, label: s.label, cells: vals.map((v) => formatSpec(s, v)), best: bestIndexes(vals, s.better) };
      }),
    { key: 'warranty', label: 'گارانتی', cells: items.map((p) => p.warranty ?? '—'), best: [] },
    { key: 'stock', label: 'وضعیت', cells: items.map((p) => (p.stock > 0 ? 'موجود' : 'ناموجود')), best: [] },
  ];

  const visibleRows = onlyDiff
    ? rows.filter((r) => !r.cells.every((c) => c === r.cells[0]))
    : rows;

  const tab = (active) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
      active ? 'border-lajevard bg-lajevard text-white' : 'border-slate-300 bg-white hover:border-lajevard'
    }`;

  return (
    <div className="space-y-4">
      {/* تب دسته‌ها (فقط وقتی کالاهای چند دسته انتخاب شده) */}
      {groups.length > 1 && (
        <div>
          <p className="mb-2 text-sm text-slate-500">
            کالاهای دسته‌های مختلف را فقط می‌شود در همان دسته مقایسه کرد:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="دسته مقایسه">
            {groups.map((g) => (
              <button
                key={g.slug}
                type="button"
                role="tab"
                aria-selected={g.slug === group.slug}
                className={tab(g.slug === group.slug)}
                onClick={() => setActiveCat(g.slug)}
              >
                {g.category?.icon} {g.category?.name ?? g.slug} ({formatNumber(g.items.length)})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-firouzeh"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
          />
          فقط تفاوت‌ها را نشان بده
        </label>
        <button type="button" onClick={cmp.clear} className="text-sm text-anar hover:underline">
          پاک کردن همه
        </button>
      </div>

      {staleIds.length > 0 && (
        <p className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">
          {formatNumber(staleIds.length)} کالای انتخاب‌شده دیگر در فروشگاه موجود نیست.
          <button type="button" className="font-medium underline" onClick={() => staleIds.forEach((id) => cmp.toggle(id))}>
            حذف از مقایسه
          </button>
        </p>
      )}

      {items.length < 2 ? (
        <div className="card p-10 text-center">
          <p className="text-5xl" aria-hidden="true">➕</p>
          <h2 className="mt-3 font-bold">برای مقایسه حداقل ۲ کالا از یک دسته لازم است</h2>
          <Link href={`/products?category=${group.slug}`} className="btn-primary mt-5">
            افزودن کالای دیگر
          </Link>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">جدول مقایسه‌ی مشخصات کالاها</caption>
              <thead>
                <tr>
                  <td className="sticky start-0 z-10 w-28 bg-white sm:w-36" />
                  {items.map((p) => (
                    <th key={p.id} scope="col" className="min-w-44 border-s border-slate-100 p-3 align-top font-normal">
                      <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-xl bg-slate-100">
                        <Image src={p.image} alt="" fill unoptimized sizes="112px" className="object-cover" />
                      </div>
                      <Link
                        href={`/products/${p.slug}`}
                        className="mt-2 line-clamp-2 block min-h-12 text-xs leading-6 hover:text-lajevard"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-2 flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={p.stock <= 0}
                          onClick={() => cart.add(p.id, 1, p.colors?.[0]?.name ?? null)}
                          className="btn-primary px-3 py-2 text-xs"
                        >
                          {p.stock <= 0 ? 'ناموجود' : 'افزودن به سبد'}
                        </button>
                        <button
                          type="button"
                          onClick={() => cmp.toggle(p.id)}
                          className="text-xs text-slate-500 hover:text-anar"
                        >
                          ✕ حذف از مقایسه
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row, ri) => (
                  <tr key={row.key} className={ri % 2 ? 'bg-white' : 'bg-slate-50'}>
                    <th
                      scope="row"
                      className={`sticky start-0 z-10 p-3 text-start text-xs font-medium text-slate-500 sm:text-sm ${
                        ri % 2 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      {row.label}
                    </th>
                    {row.cells.map((cell, i) => {
                      const best = row.best.includes(i);
                      return (
                        <td key={items[i].id} className={`border-s border-slate-100 p-3 text-center ${best ? BEST : ''}`}>
                          {cell}
                          {best && <span className="mt-0.5 block text-[10px] font-medium">✓ بهترین</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* رنگ‌ها */}
                <tr className={visibleRows.length % 2 ? 'bg-white' : 'bg-slate-50'}>
                  <th
                    scope="row"
                    className={`sticky start-0 z-10 p-3 text-start text-xs font-medium text-slate-500 sm:text-sm ${
                      visibleRows.length % 2 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    رنگ‌ها
                  </th>
                  {items.map((p) => (
                    <td key={p.id} className="border-s border-slate-100 p-3">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {(p.colors ?? []).map((c) => (
                          <span
                            key={c.name}
                            title={c.name}
                            role="img"
                            aria-label={c.name}
                            className="h-5 w-5 rounded-full border border-slate-300"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                        {(p.colors ?? []).length === 0 && '—'}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500">
            <span className="rounded bg-green-50 px-1.5 py-0.5 font-medium text-green-700">سبز</span> یعنی بهترین مقدار در
            آن ردیف. اگر همه‌ی مقادیر برابر باشند، چیزی علامت نمی‌خورد.
          </p>
        </>
      )}
    </div>
  );
}