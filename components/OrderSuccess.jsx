'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import OrderTimeline from '@/components/OrderTimeline';
import { useStore } from '@/hooks/useStore';
import { findOrder } from '@/services/orderService';
import { formatDate, formatDateTime, formatNumber, formatPrice } from '@/lib/format';

function Info({ title, children }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-bold text-lajevard">{title}</h3>
      <div className="space-y-1 text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function OrderSuccess({ trackingCode }) {
  const [orders, , ready] = useStore('orders', []);
  const [copied, setCopied] = useState(false);
  const [session] = useStore('session', null);
  

  if (!ready) {
    return <div className="card mx-auto h-96 max-w-3xl animate-pulse bg-slate-100" aria-busy="true" />;
  }

  const found = findOrder(orders, trackingCode);
  const order =
    found && (!found.userId || found.userId === session?.id || session?.role === 'admin')
      ? found
      : null;

  if (!order) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <p className="text-5xl" aria-hidden="true">🔎</p>
        <h1 className="mt-3 text-xl font-bold">سفارشی با این کد پیدا نشد</h1>
        <p className="mt-2 text-sm text-slate-500">
          سفارش‌ها فقط در همین مرورگر ذخیره می‌شوند (پروژه بدون بک‌اند است).
        </p>
        <Link href="/" className="btn-primary mt-6">بازگشت به خانه</Link>
      </div>
    );
  }

  const { eta, timeSlot } = order.shipping;
  const from = formatDate(eta.from);
  const to = formatDate(eta.to);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* کلیپ‌بورد در دسترس نیست؛ کاربر می‌تواند دستی کپی کند */
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* سربرگ موفقیت */}
      <section className="card p-6 text-center" aria-live="polite">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-firouzeh text-3xl text-white">✓</div>
        <h1 className="mt-4 text-xl font-bold text-lajevard md:text-2xl">سفارش شما با موفقیت ثبت شد</h1>
        <p className="mt-1 text-sm text-slate-500">
          {order.customer.fullName} عزیز، از خرید شما سپاسگزاریم.
        </p>

        <div className="mx-auto mt-5 inline-flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-start">
            <p className="text-xs text-slate-500">کد پیگیری سفارش</p>
            <p dir="ltr" className="text-lg font-bold tracking-wider">{order.trackingCode}</p>
          </div>
          <button type="button" onClick={copy} className="btn-outline px-3 py-1.5 print:hidden">
            {copied ? 'کپی شد ✓' : 'کپی'}
          </button>
        </div>
      </section>

      {/* وضعیت */}
      <section className="card p-4" aria-label="وضعیت سفارش">
        <OrderTimeline status={order.status} />
      </section>

      {/* تحویل / پرداخت / آدرس */}
      <div className="grid gap-4 md:grid-cols-3">
        <Info title="🚚 زمان تحویل">
          <p className="font-medium text-slate-800">{from === to ? from : `${from} تا ${to}`}</p>
          {timeSlot && <p>ساعت {timeSlot.label}</p>}
          <p>{order.shipping.title}</p>
        </Info>

        <Info title="💳 پرداخت">
          <p className="font-medium text-firouzeh-dark">پرداخت موفق</p>
          <p>مبلغ: {formatPrice(order.totals.total)}</p>
          <p>شماره مرجع: <span dir="ltr">{order.payment.refId}</span></p>
          <p>{formatDateTime(order.payment.paidAt)}</p>
        </Info>

        <Info title="📍 آدرس تحویل">
          <p className="font-medium text-slate-800">{order.customer.fullName}</p>
          <p>{order.address.city}، {order.address.address}</p>
          <p>کد پستی: <span dir="ltr">{order.address.postalCode}</span></p>
          <p>موبایل: <span dir="ltr">{order.customer.mobile}</span></p>
        </Info>
      </div>

      {/* اقلام */}
      <section className="card overflow-hidden" aria-labelledby="items-title">
        <h2 id="items-title" className="border-b border-slate-100 p-4 text-sm font-bold text-lajevard">
          اقلام سفارش ({formatNumber(order.totals.itemCount)} کالا)
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
                  {formatNumber(it.qty)} عدد{it.color ? ` · ${it.color}` : ''}
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-medium">
                {formatPrice(it.unitPrice * it.qty)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">قیمت کالاها</dt>
            <dd>{formatPrice(order.totals.originalTotal)}</dd>
          </div>
          {order.totals.discountTotal > 0 && (
            <div className="flex justify-between text-anar">
              <dt>سود شما از خرید</dt>
              <dd>−{formatPrice(order.totals.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">هزینه ارسال</dt>
            <dd>{order.totals.shippingCost === 0 ? 'رایگان' : formatPrice(order.totals.shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <dt>مبلغ پرداخت‌شده</dt>
            <dd className="text-lajevard">{formatPrice(order.totals.total)}</dd>
          </div>
        </dl>
      </section>

      {order.note && (
        <p className="card p-4 text-sm text-slate-600">📝 توضیحات: {order.note}</p>
      )}

      <p className="text-center text-xs text-slate-400">
        ثبت‌شده در {formatDateTime(order.createdAt)} · این یک سفارش نمایشی است و پرداخت واقعی انجام نشده.
      </p>

      <div className="flex flex-wrap justify-center gap-3 print:hidden">
        <button type="button" onClick={() => window.print()} className="btn-outline">🖨️ چاپ رسید</button>
        <Link href="/profile/orders" className="btn-outline">پیگیری سفارش‌ها</Link>
        <Link href="/products" className="btn-primary">ادامه‌ی خرید</Link>
      </div>
    </div>
  );
}