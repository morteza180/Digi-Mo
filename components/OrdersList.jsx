'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/hooks/useStore';
import { ORDER_STEPS } from '@/lib/constants';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format';

const STATUS_LABEL = {
  ...Object.fromEntries(ORDER_STEPS.map((s) => [s.key, s.label])),
  canceled: 'لغو شده',
};
const STATUS_STYLE = {
  placed: 'bg-slate-100 text-slate-700',
  processing: 'bg-zaferan/20 text-amber-800',
  shipped: 'bg-lajevard-light text-lajevard',
  delivered: 'bg-firouzeh/15 text-firouzeh-dark',
  canceled: 'bg-red-50 text-anar',
};

export default function OrdersList() {
  const { user } = useAuth();
  const [orders, , ready] = useStore('orders', []);

  if (!ready) return <div className="card h-40 animate-pulse bg-slate-100" aria-busy="true" />;

  const mine = orders
    .filter((o) => o.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (mine.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-5xl" aria-hidden="true">📦</p>
        <h2 className="mt-3 font-bold">هنوز سفارشی ثبت نکرده‌ای</h2>
        <Link href="/products" className="btn-primary mt-5">مشاهده محصولات</Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {mine.map((o) => (
        <li key={o.id}>
          <Link
            href={`/order/success/${o.trackingCode}`}
            className="card flex flex-wrap items-center gap-4 p-4 transition hover:border-firouzeh hover:shadow-md"
          >
            <div className="flex -space-x-3 space-x-reverse" aria-hidden="true">
              {o.items.slice(0, 3).map((it) => (
                <span key={`${it.id}-${it.color ?? ''}`} className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-slate-100">
                  <Image src={it.image} alt="" fill unoptimized sizes="48px" className="object-cover" />
                </span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <p dir="ltr" className="text-start text-sm font-bold">{o.trackingCode}</p>
              <p className="text-xs text-slate-500">
                {formatDateTime(o.createdAt)} · {formatNumber(o.totals.itemCount)} کالا
              </p>
            </div>

            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[o.status] ?? STATUS_STYLE.placed}`}>
              {STATUS_LABEL[o.status] ?? o.status}
            </span>
            <span className="font-bold text-lajevard">{formatPrice(o.totals.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}