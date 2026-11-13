'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useBaseData } from '@/hooks/useCatalog';
import { getProductStates } from '@/services/adminService';
import {
  deleteCategory, getCategoryStates, resetAllCategories, resetCategory, restoreCategory,
} from '@/services/categoryService';
import { downloadJSON } from '@/services/dataService';
import { formatNumber } from '@/lib/format';

const BADGE = {
  added: ['جدید', 'bg-green-50 text-green-700'],
  edited: ['ویرایش‌شده', 'bg-zaferan/20 text-amber-800'],
  deleted: ['حذف‌شده', 'bg-red-50 text-anar'],
};

export default function AdminCategoriesView({ products }) {
  const { categories: baseCategories } = useBaseData();
  const [catOverlay, , r1] = useStore('categories', {});
  const [prodOverlay, , r2] = useStore('products', {});
  const [error, setError] = useState('');

  const rows = useMemo(() => getCategoryStates(baseCategories, catOverlay), [baseCategories, catOverlay]);

  const counts = useMemo(() => {
    const map = {};
    getProductStates(products, prodOverlay)
      .filter((p) => p._state !== 'deleted')
      .forEach((p) => { map[p.category] = (map[p.category] ?? 0) + 1; });
    return map;
  }, [products, prodOverlay]);

  const changed = rows.filter((c) => c._state !== 'base').length;

  const onDelete = (c) => {
    setError('');
    const n = counts[c.slug] ?? 0;
    if (n > 0) {
      setError(`دسته‌ی «${c.name}» ${formatNumber(n)} محصول دارد؛ ابتدا محصولاتش را به دسته‌ی دیگری ببر یا حذف کن.`);
      return;
    }
    if (window.confirm(`دسته‌ی «${c.name}» حذف شود؟`)) deleteCategory(c.id);
  };

  const onResetAll = () => {
    if (window.confirm('همه‌ی افزوده‌ها، ویرایش‌ها و حذف‌های دسته‌ها پاک شود و به فایل JSON برگردند؟')) {
      resetAllCategories();
    }
  };

  const onExport = () =>
    downloadJSON(
      'categories.json',
      rows.filter((c) => c._state !== 'deleted').map(({ _state, ...rest }) => rest)
    );

  if (!r1 || !r2) return <div className="card h-80 animate-pulse bg-slate-100" aria-busy="true" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/categories/new" className="btn-primary">+ افزودن دسته</Link>
        <button type="button" onClick={onExport} className="btn-outline">⬇️ خروجی JSON</button>
        {changed > 0 && (
          <button type="button" onClick={onResetAll} className="btn-outline text-anar">
            بازنشانی همه تغییرات ({formatNumber(changed)})
          </button>
        )}
      </div>

      <p className="rounded-xl bg-lajevard-light p-3 text-xs leading-6 text-lajevard-dark">
        مثل محصولات، تغییرات فقط در همین مرورگر ذخیره می‌شوند. برای دائمی کردن، «خروجی JSON» را بگیر،
        فایل <code dir="ltr">public/data/categories.json</code> را جایگزین کن و بعد «بازنشانی همه تغییرات» را بزن.
      </p>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{error}</p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">فهرست دسته‌بندی‌ها</caption>
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="p-3 text-start font-medium">دسته</th>
              <th scope="col" className="p-3 text-start font-medium">slug</th>
              <th scope="col" className="p-3 text-start font-medium">ترتیب</th>
              <th scope="col" className="p-3 text-start font-medium">محصولات</th>
              <th scope="col" className="p-3 text-start font-medium">مشخصات فنی</th>
              <th scope="col" className="p-3 text-start font-medium">وضعیت</th>
              <th scope="col" className="p-3 text-start font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const deleted = c._state === 'deleted';
              const badge = BADGE[c._state];
              return (
                <tr key={c.id} className={`border-t border-slate-100 ${deleted ? 'bg-slate-50 opacity-60' : ''}`}>
                  <td className="p-3 font-medium">
                    <span aria-hidden="true">{c.icon}</span> {c.name}
                  </td>
                  <td dir="ltr" className="p-3 text-start text-xs text-slate-500">{c.slug}</td>
                  <td className="p-3">{formatNumber(c.order ?? 0)}</td>
                  <td className="p-3">{formatNumber(counts[c.slug] ?? 0)}</td>
                  <td className="p-3">{formatNumber(c.specSchema?.length ?? 0)} مورد</td>
                  <td className="p-3">
                    {badge && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[1]}`}>{badge[0]}</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-3 whitespace-nowrap text-xs">
                      {deleted ? (
                        <button type="button" onClick={() => restoreCategory(c.id)} className="font-medium text-firouzeh-dark hover:underline">
                          بازگردانی
                        </button>
                      ) : (
                        <>
                          <Link href={`/admin/categories/${c.id}`} className="font-medium text-lajevard hover:underline">ویرایش</Link>
                          <button type="button" onClick={() => onDelete(c)} className="text-anar hover:underline">حذف</button>
                        </>
                      )}
                      {c._state === 'edited' && (
                        <button type="button" onClick={() => resetCategory(c.id)} className="text-slate-500 hover:underline">بازنشانی</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-slate-500">دسته‌ای وجود ندارد.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}