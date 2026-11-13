'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import {
  deleteProduct, getProductStates, resetAllProducts, resetProduct, restoreProduct,
} from '@/services/adminService';
import { downloadJSON } from '@/services/dataService';
import { calcFinalPrice, formatNumber, formatPrice, normalizeFa } from '@/lib/format';
import { useCategories } from '@/hooks/useCatalog';


const BADGE = {
  added: ['جدید', 'bg-green-50 text-green-700'],
  edited: ['ویرایش‌شده', 'bg-zaferan/20 text-amber-800'],
  deleted: ['حذف‌شده', 'bg-red-50 text-anar'],
};

export default function AdminProductsView({ products }) {
  const categories = useCategories();  const [overlay, , ready] = useStore('products', {});
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');

  const rows = useMemo(() => getProductStates(products, overlay), [products, overlay]);
  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c.name])), [categories]);

  const filtered = useMemo(() => {
    const q = normalizeFa(query);
    return rows
      .filter((p) => cat === 'all' || p.category === cat)
      .filter((p) => !q || normalizeFa(`${p.name} ${p.brandName} ${p.brand} ${p.slug}`).includes(q));
  }, [rows, cat, query]);

  const changed = rows.filter((p) => p._state !== 'base').length;

  const onDelete = (p) => {
    if (window.confirm(`«${p.name}» حذف شود؟`)) deleteProduct(p.id);
  };
  const onResetAll = () => {
    if (window.confirm('همه‌ی افزوده‌ها، ویرایش‌ها و حذف‌ها پاک شود و محصولات به فایل JSON برگردند؟')) {
      resetAllProducts();
    }
  };
  const onExport = () =>
    downloadJSON(
      'products.json',
      rows.filter((p) => p._state !== 'deleted').map(({ _state, ...rest }) => rest)
    );

  if (!ready) return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/products/new" className="btn-primary">+ افزودن محصول</Link>
        <button type="button" onClick={onExport} className="btn-outline">⬇️ خروجی JSON</button>
        {changed > 0 && (
          <button type="button" onClick={onResetAll} className="btn-outline text-anar">
            بازنشانی همه تغییرات ({formatNumber(changed)})
          </button>
        )}
      </div>

      <p className="rounded-xl bg-lajevard-light p-3 text-xs leading-6 text-lajevard-dark">
        تغییرات فقط در <strong>همین مرورگر</strong> ذخیره می‌شوند. برای دائمی کردن: «خروجی JSON» را بگیر،
        فایل <code dir="ltr">public/data/products.json</code> را با آن جایگزین کن و بعد حتماً «بازنشانی همه تغییرات» را بزن
        (وگرنه کالاهای افزوده‌شده دوبار نمایش داده می‌شوند).
      </p>

      <div className="card grid gap-3 p-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="جستجوی نام، برند یا slug..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="جستجو"
        />
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="دسته">
          <option value="all">همه‌ی دسته‌ها</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <p className="text-sm text-slate-500">{formatNumber(filtered.length)} محصول</p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">فهرست محصولات</caption>
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="p-3 text-start font-medium">محصول</th>
              <th scope="col" className="p-3 text-start font-medium">دسته</th>
              <th scope="col" className="p-3 text-start font-medium">قیمت نهایی</th>
              <th scope="col" className="p-3 text-start font-medium">موجودی</th>
              <th scope="col" className="p-3 text-start font-medium">وضعیت</th>
              <th scope="col" className="p-3 text-start font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const deleted = p._state === 'deleted';
              const badge = BADGE[p._state];
              return (
                <tr key={p.id} className={`border-t border-slate-100 ${deleted ? 'bg-slate-50 opacity-60' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image src={p.image} alt="" fill unoptimized sizes="48px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        {deleted ? (
                          <p className="line-clamp-2 max-w-xs">{p.name}</p>
                        ) : (
                          <Link href={`/products/${p.slug}`} className="line-clamp-2 max-w-xs hover:text-lajevard">
                            {p.name}
                          </Link>
                        )}
                        <p className="text-xs text-slate-400">{p.brandName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{catName[p.category] ?? p.category}</td>
                  <td className="p-3 whitespace-nowrap">
                    {formatPrice(calcFinalPrice(p.price, p.discount))}
                    {p.discount > 0 && <span className="ms-1 text-xs text-anar">({formatNumber(p.discount)}٪)</span>}
                  </td>
                  <td className={`p-3 whitespace-nowrap ${p.stock <= 0 ? 'font-medium text-anar' : p.stock <= 5 ? 'font-medium text-amber-700' : ''}`}>
                    {p.stock <= 0 ? 'ناموجود' : formatNumber(p.stock)}
                  </td>
                  <td className="p-3">
                    {badge && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[1]}`}>{badge[0]}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-3 whitespace-nowrap text-xs">
                      {deleted ? (
                        <button type="button" onClick={() => restoreProduct(p.id)} className="font-medium text-firouzeh-dark hover:underline">
                          بازگردانی
                        </button>
                      ) : (
                        <>
                          <Link href={`/admin/products/${p.id}`} className="font-medium text-lajevard hover:underline">ویرایش</Link>
                          <button type="button" onClick={() => onDelete(p)} className="text-anar hover:underline">حذف</button>
                        </>
                      )}
                      {p._state === 'edited' && (
                        <button type="button" onClick={() => resetProduct(p.id)} className="text-slate-500 hover:underline">
                          بازنشانی
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">محصولی پیدا نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}