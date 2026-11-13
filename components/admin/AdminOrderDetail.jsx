'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import OrderTimeline from '@/components/OrderTimeline';
import { useStore } from '@/hooks/useStore';
import { ACTION_LABEL, CANCELABLE, NEXT_STATUS, updateOrderStatus } from '@/services/adminService';
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '@/lib/constants';
import { formatDate, formatDateTime, formatNumber, formatPrice } from '@/lib/format';

function Box({ title, children }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-bold text-lajevard">{title}</h3>
      <div className="space-y-1 text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function AdminOrderDetail({ trackingCode, products }) {
  const [orders, , ready] = useStore('orders', []);
  const [users] = useStore('users', []);
  const [error, setError] = useState('');

  if (!ready) return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;

  const order = orders.find((o) => o.trackingCode === trackingCode);

  if (!order) {
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl" aria-hidden="true">🔎</p>
        <h1 className="mt-3 text-xl font-bold">سفارشی با این کد پیدا نشد</h1>
        <Link href="/admin/orders" className="btn-primary mt-5">بازگشت به سفارش‌ها</Link>
      </div>
    );
  }

  const next = NEXT_STATUS[order.status];
  const canCancel = CANCELABLE.includes(order.status);
  const owner = users.find((u) => u.id === order.userId);
  const { eta, timeSlot } = order.shipping;
  const from = formatDate(eta.from);
  const to = formatDate(eta.to);

  const history = [
    { key: 'created', label: 'ثبت سفارش', at: order.createdAt },
    ...(order.statusHistory ?? []).map((h, i) => ({
      key: `${h.status}-${i}`,
      label: ORDER_STATUS_LABEL[h.status] ?? h.status,
      at: h.at,
    })),
  ];

  const run = (target) => {
    setError('');
    try {
      updateOrderStatus(order.id, target, products);
    } catch (e) {
      setError(e.message);
    }
  };

  const onCancel = () => {
    const note = order.stockReserved ? ' موجودی کالاهای این سفارش به انبار برمی‌گردد.' : '';
    if (window.confirm(`سفارش ${order.trackingCode} لغو شود؟ این کار برگشت‌پذیر نیست.${note}`)) run('canceled');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-firouzeh-dark hover:underline">← همه‌ی سفارش‌ها</Link>
          <h1 dir="ltr" className="mt-1 text-start text-2xl font-bold text-lajevard">{order.trackingCode}</h1>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${ORDER_STATUS_STYLE[order.status] ?? ORDER_STATUS_STYLE.placed}`}>
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <section className="card space-y-4 p-4" aria-label="وضعیت و عملیات">
        <OrderTimeline status={order.status} />

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {next && (
            <button type="button" className="btn-primary" onClick={() => run(next)}>{ACTION_LABEL[next]}</button>
          )}
          {canCancel && (
            <button type="button" className="btn-outline text-anar" onClick={onCancel}>لغو سفارش</button>
          )}
          <Link href={`/order/success/${order.trackingCode}`} className="btn-outline">
            مشاهده‌ی صفحه‌ی مشتری
          </Link>
        </div>
        {!next && !canCancel && (
          <p className="text-xs text-slate-400">این سفارش در وضعیت نهایی است و دیگر قابل تغییر نیست.</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Box title="👤 مشتری">
          <p className="font-medium text-slate-800">{order.customer.fullName}</p>
          <p>موبایل: <span dir="ltr">{order.customer.mobile}</span></p>
          <p>
            حساب کاربری:{' '}
            {owner ? `${owner.name} (${owner.email})` : order.userId ? 'کاربر حذف‌شده' : 'مهمان'}
          </p>
        </Box>

        <Box title="📍 آدرس تحویل">
          <p>{order.address.city}، {order.address.address}</p>
          <p>کد پستی: <span dir="ltr">{order.address.postalCode}</span></p>
          {order.note && <p>📝 {order.note}</p>}
        </Box>

        <Box title="🚚 ارسال و پرداخت">
          <p className="font-medium text-slate-800">{order.shipping.title}</p>
          <p>تحویل: {from === to ? from : `${from} تا ${to}`}{timeSlot ? ` · ${timeSlot.label}` : ''}</p>
          <p>پرداخت (نمایشی): <span dir="ltr">{order.payment.refId}</span></p>
          <p>{order.stockReserved ? 'موجودی انبار کم شده ✓' : 'موجودی این سفارش دستی کم نشده'}</p>
        </Box>
      </div>

      <section className="card overflow-hidden" aria-labelledby="ao-items">
        <h2 id="ao-items" className="border-b border-slate-100 p-4 text-sm font-bold text-lajevard">
          اقلام ({formatNumber(order.totals.itemCount)} کالا)
        </h2>
        <ul className="divide-y divide-slate-100">
          {order.items.map((it) => (
            <li key={`${it.id}-${it.color ?? ''}`} className="flex items-center gap-3 p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <Image src={it.image} alt="" fill unoptimized sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{it.name}</p>
                <p className="text-xs text-slate-400">
                  {formatNumber(it.qty)} عدد × {formatPrice(it.unitPrice)}{it.color ? ` · ${it.color}` : ''}
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-medium">{formatPrice(it.unitPrice * it.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">جمع کالاها</dt>
            <dd>{formatPrice(order.totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">هزینه ارسال</dt>
            <dd>{order.totals.shippingCost === 0 ? 'رایگان' : formatPrice(order.totals.shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <dt>مبلغ کل</dt>
            <dd className="text-lajevard">{formatPrice(order.totals.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="card p-4" aria-labelledby="ao-history">
        <h2 id="ao-history" className="mb-3 text-sm font-bold text-lajevard">تاریخچه‌ی وضعیت</h2>
        <ol className="space-y-2 text-sm">
          {history.map((h) => (
            <li key={h.key} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <span>{h.label}</span>
              <span className="text-xs text-slate-400">{formatDateTime(h.at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}