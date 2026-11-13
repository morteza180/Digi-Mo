'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { ACTION_LABEL, NEXT_STATUS, updateOrderStatus } from '@/services/adminService';
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '@/lib/constants';
import { formatDateTime, formatNumber, formatPrice, normalizeFa } from '@/lib/format';

const TAB_KEYS = ['all', 'placed', 'processing', 'shipped', 'delivered', 'canceled'];

export default function AdminOrdersView({ products }) {
  const [orders, , ready] = useStore('orders', []);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const counts = useMemo(() => {
    const c = { all: orders.length };
    orders.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [orders]);

  const list = useMemo(() => {
    const q = normalizeFa(query);
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((o) => tab === 'all' || o.status === tab)
      .filter(
        (o) => !q || normalizeFa(`${o.trackingCode} ${o.customer.fullName} ${o.customer.mobile}`).includes(q)
      );
  }, [orders, tab, query]);

  const advance = (o) => {
    setError('');
    try {
      updateOrderStatus(o.id, NEXT_STATUS[o.status], products);
    } catch (e) {
      setError(e.message);
    }
  };

  if (!ready) return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;

  // «ثبت‌شده» فقط برای سفارش‌های قدیمی (قبل از وضعیت آماده‌سازی) وجود دارد
  const tabs = TAB_KEYS.filter((k) => k !== 'placed' || counts.placed > 0);

  const tabClass = (active) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
      active ? 'border-lajevard bg-lajevard text-white' : 'border-slate-300 bg-white hover:border-lajevard'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="وضعیت سفارش">
        {tabs.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={tabClass(tab === k)}
            onClick={() => setTab(k)}
          >
            {k === 'all' ? 'همه' : ORDER_STATUS_LABEL[k]} ({formatNumber(counts[k] ?? 0)})
          </button>
        ))}
      </div>

      <input
        className="input sm:max-w-sm"
        placeholder="جستجوی کد پیگیری، نام یا موبایل..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="جستجو"
      />

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{error}</p>
      )}

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl" aria-hidden="true">🧾</p>
          <h2 className="mt-3 font-bold">هنوز سفارشی ثبت نشده است</h2>
          <p className="mt-1 text-sm text-slate-500">
            سفارش‌ها در همین مرورگر ذخیره می‌شوند؛ یک خرید آزمایشی با حساب مشتری انجام بده.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <caption className="sr-only">فهرست سفارش‌ها</caption>
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="p-3 text-start font-medium">کد پیگیری</th>
                <th scope="col" className="p-3 text-start font-medium">مشتری</th>
                <th scope="col" className="p-3 text-start font-medium">تاریخ ثبت</th>
                <th scope="col" className="p-3 text-start font-medium">مبلغ</th>
                <th scope="col" className="p-3 text-start font-medium">وضعیت</th>
                <th scope="col" className="p-3 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => {
                const next = NEXT_STATUS[o.status];
                return (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="p-3">
                      <Link href={`/admin/orders/${o.trackingCode}`} dir="ltr" className="block text-start font-medium text-lajevard hover:underline">
                        {o.trackingCode}
                      </Link>
                    </td>
                    <td className="p-3">
                      <p>{o.customer.fullName}</p>
                      <p dir="ltr" className="text-start text-xs text-slate-400">{o.customer.mobile}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{formatDateTime(o.createdAt)}</td>
                    <td className="p-3 whitespace-nowrap font-medium">{formatPrice(o.totals.total)}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_STYLE[o.status] ?? ORDER_STATUS_STYLE.placed}`}>
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2 whitespace-nowrap text-xs">
                        {next && (
                          <button type="button" onClick={() => advance(o)} className="btn-primary px-3 py-1.5 text-xs">
                            {ACTION_LABEL[next]}
                          </button>
                        )}
                        <Link href={`/admin/orders/${o.trackingCode}`} className="font-medium text-lajevard hover:underline">
                          جزئیات
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">سفارشی با این فیلتر پیدا نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}