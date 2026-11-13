'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/hooks/useStore';
import { deleteUser, setUserRole } from '@/services/adminService';
import { formatDate, formatNumber, formatPrice, normalizeFa } from '@/lib/format';

export default function AdminUsersView() {
  const { user: me } = useAuth();
  const [users, , r1] = useStore('users', []);
  const [orders, , r2] = useStore('orders', []);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  // آمار خرید هر کاربر (سفارش‌های لغوشده در مبلغ حساب نمی‌شوند)
  const stats = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (!o.userId) return;
      const s = map.get(o.userId) ?? { count: 0, spent: 0 };
      s.count += 1;
      if (o.status !== 'canceled') s.spent += o.totals.total;
      map.set(o.userId, s);
    });
    return map;
  }, [orders]);

  const list = useMemo(() => {
    const q = normalizeFa(query);
    return [...users]
      .sort((a, b) => (a.role === b.role ? new Date(b.createdAt) - new Date(a.createdAt) : a.role === 'admin' ? -1 : 1))
      .filter((u) => !q || normalizeFa(`${u.name} ${u.email}`).includes(q));
  }, [users, query]);

  const run = (fn) => {
    setError('');
    try {
      fn();
    } catch (e) {
      setError(e.message);
    }
  };

  const onRole = (u) => {
    const next = u.role === 'admin' ? 'customer' : 'admin';
    const msg =
      next === 'admin'
        ? `«${u.name}» به ادمین ارتقا پیدا کند؟`
        : `دسترسی ادمین «${u.name}» برداشته شود؟`;
    if (window.confirm(msg)) run(() => setUserRole(u.id, next, me?.id));
  };

  const onDelete = (u) => {
    const count = stats.get(u.id)?.count ?? 0;
    const extra = count > 0 ? ` سفارش‌های او (${formatNumber(count)} مورد) برای سوابق باقی می‌مانند.` : '';
    if (window.confirm(`حساب «${u.name}» حذف شود؟ این کار برگشت‌پذیر نیست.${extra}`)) {
      run(() => deleteUser(u.id, me?.id));
    }
  };

  if (!r1 || !r2) return <div className="card h-80 animate-pulse bg-slate-100" aria-busy="true" />;

  return (
    <div className="space-y-4">
      <input
        className="input sm:max-w-sm"
        placeholder="جستجوی نام یا ایمیل..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="جستجو"
      />

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{error}</p>
      )}

      <p className="text-sm text-slate-500">{formatNumber(list.length)} کاربر</p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">فهرست کاربران</caption>
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="p-3 text-start font-medium">کاربر</th>
              <th scope="col" className="p-3 text-start font-medium">نقش</th>
              <th scope="col" className="p-3 text-start font-medium">عضویت</th>
              <th scope="col" className="p-3 text-start font-medium">سفارش‌ها</th>
              <th scope="col" className="p-3 text-start font-medium">مجموع خرید</th>
              <th scope="col" className="p-3 text-start font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const s = stats.get(u.id) ?? { count: 0, spent: 0 };
              const self = u.id === me?.id;
              return (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <p className="font-medium">
                      {u.name}
                      {self && <span className="ms-2 rounded-full bg-lajevard-light px-2 py-0.5 text-xs text-lajevard">شما</span>}
                    </p>
                    <p dir="ltr" className="text-start text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        u.role === 'admin' ? 'bg-zaferan/20 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role === 'admin' ? 'ادمین' : 'مشتری'}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-600">{formatDate(u.createdAt)}</td>
                  <td className="p-3">{formatNumber(s.count)}</td>
                  <td className="p-3 whitespace-nowrap">{s.spent ? formatPrice(s.spent) : '—'}</td>
                  <td className="p-3">
                    {self ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 whitespace-nowrap text-xs">
                        <button type="button" onClick={() => onRole(u)} className="font-medium text-lajevard hover:underline">
                          {u.role === 'admin' ? 'تبدیل به مشتری' : 'ارتقا به ادمین'}
                        </button>
                        <button type="button" onClick={() => onDelete(u)} className="text-anar hover:underline">حذف</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">کاربری پیدا نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-6 text-slate-400">
        رمز عبور و هش آن هیچ‌جا نمایش داده نمی‌شود. حذف کاربر، ذخیره‌های او را پاک می‌کند ولی سفارش‌هایش برای سوابق می‌ماند.
      </p>
    </div>
  );
}