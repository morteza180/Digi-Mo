'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useStore } from '@/hooks/useStore';
import { mergeCollection } from '@/services/dataService';
import { ORDER_STEPS } from '@/lib/constants';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format';

const STATUS_LABEL = {
  ...Object.fromEntries(ORDER_STEPS.map((s) => [s.key, s.label])),
  canceled: 'لغو شده',
};
const ACTIVE = ['placed', 'processing', 'shipped'];
const LOW_STOCK = 5;

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }); // YYYY-MM-DD
const weekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'short', timeZone: 'Asia/Tehran' });

function Stat({ icon, label, value, hint, tone = 'text-lajevard' }) {
  return (
    <div className="card p-4">
      <p className="text-2xl" aria-hidden="true">{icon}</p>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard({ products }) {
  const [overlay, , r1] = useStore('products', {});
  const [orders, , r2] = useStore('orders', []);
  const [users, , r3] = useStore('users', []);

  const data = useMemo(() => {
    const all = mergeCollection(products, overlay);
    const live = orders.filter((o) => o.status !== 'canceled');

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86_400_000);
      return { key: dayKey.format(d), label: weekday.format(d), total: 0 };
    });
    live.forEach((o) => {
      const slot = days.find((d) => d.key === dayKey.format(new Date(o.createdAt)));
      if (slot) slot.total += o.totals.total;
    });

    return {
      productCount: all.length,
      outCount: all.filter((p) => p.stock <= 0).length,
      lowStock: all.filter((p) => p.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock).slice(0, 6),
      revenue: live.reduce((s, o) => s + o.totals.total, 0),
      pending: orders.filter((o) => ACTIVE.includes(o.status)).length,
      customers: users.filter((u) => u.role === 'customer').length,
      recent: [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      days,
      maxDay: Math.max(1, ...days.map((d) => d.total)),
    };
  }, [products, overlay, orders, users]);

  if (!r1 || !r2 || !r3) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse bg-slate-100" />)}
        </div>
        <div className="card h-56 animate-pulse bg-slate-100" />
      </div>
    );
  }

  const { productCount, outCount, lowStock, revenue, pending, customers, recent, days, maxDay } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="💰" label="درآمد (نمایشی)" value={formatPrice(revenue)} hint="مجموع سفارش‌های غیرلغوشده" />
        <Stat icon="🧾" label="سفارش‌ها" value={formatNumber(orders.length)} hint={`${formatNumber(pending)} در جریان`} />
        <Stat icon="📦" label="محصولات" value={formatNumber(productCount)} hint={`${formatNumber(outCount)} ناموجود`} />
        <Stat icon="👥" label="مشتریان" value={formatNumber(customers)} />
      </div>

      <section className="card p-4" aria-labelledby="chart-title">
        <h2 id="chart-title" className="mb-4 font-bold text-lajevard">فروش ۷ روز اخیر</h2>
        <ul className="flex h-44 items-end gap-2">
          {days.map((d) => (
            <li
              key={d.key}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${d.label}: ${formatPrice(d.total)}`}
              aria-label={`${d.label}: ${formatPrice(d.total)}`}
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-lg ${d.total ? 'bg-firouzeh' : 'bg-slate-200'}`}
                  style={{ height: `${Math.max(2, (d.total / maxDay) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{d.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4" aria-labelledby="low-title">
          <h2 id="low-title" className="mb-3 font-bold text-lajevard">⚠️ کم‌موجود و ناموجود</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">همه‌ی کالاها موجودی کافی دارند.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-lajevard">
                    <span className="line-clamp-1">{p.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${p.stock <= 0 ? 'bg-red-50 text-anar' : 'bg-zaferan/20 text-amber-800'}`}>
                      {p.stock <= 0 ? 'ناموجود' : `${formatNumber(p.stock)} عدد`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4" aria-labelledby="recent-title">
          <h2 id="recent-title" className="mb-3 font-bold text-lajevard">🧾 آخرین سفارش‌ها</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/success/${o.trackingCode}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-lajevard">
                    <span className="min-w-0">
                      <span dir="ltr" className="block text-start font-medium">{o.trackingCode}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {o.customer.fullName} · {formatDateTime(o.createdAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="block font-medium">{formatPrice(o.totals.total)}</span>
                      <span className="block text-xs text-slate-500">{STATUS_LABEL[o.status] ?? o.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}