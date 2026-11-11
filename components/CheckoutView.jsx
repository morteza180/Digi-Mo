'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useStore } from '@/hooks/useStore';
import { mergeCollection } from '@/services/dataService';
import { resolveLines, calcTotals } from '@/services/cartService';
import { createOrder } from '@/services/orderService';
import { getShippingMethods, calcShipping, estimateDelivery } from '@/lib/delivery';
import {
  formatDate, formatNumber, formatPrice, isValidIranMobile, isValidPostalCode,
} from '@/lib/format';
import { adjustStock } from '@/services/stockService';
import { useSettings } from '@/hooks/useCatalog';


const EMPTY = { fullName: '', mobile: '', city: '', address: '', postalCode: '', note: '' };

function validate(f) {
  const e = {};
  if (f.fullName.trim().length < 3) e.fullName = 'نام و نام خانوادگی را کامل وارد کن.';
  if (!isValidIranMobile(f.mobile)) e.mobile = 'شماره موبایل معتبر نیست (مثال: 09123456789).';
  if (!f.city) e.city = 'شهر را انتخاب کن.';
  if (f.address.trim().length < 10) e.address = 'آدرس را دقیق‌تر بنویس (حداقل ۱۰ کاراکتر).';
  if (!isValidPostalCode(f.postalCode)) e.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
  return e;
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-anar">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function formatEta(eta) {
  const a = formatDate(eta.from);
  const b = formatDate(eta.to);
  return a === b ? a : `${a} تا ${b}`;
}

function Skeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-busy="true">
      <div className="card h-96 animate-pulse bg-slate-100 lg:col-span-2" />
      <div className="card h-72 animate-pulse bg-slate-100" />
    </div>
  );
}

function Processing() {
  return (
    <div className="card mx-auto max-w-md p-12 text-center" role="status" aria-live="polite">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-firouzeh" />
      <h2 className="mt-5 font-bold text-lajevard">در حال ثبت سفارش...</h2>
      <p className="mt-1 text-sm text-slate-500">لطفاً صفحه را نبندید.</p>
    </div>
  );
}

export default function CheckoutView({ products }) {
  const settings = useSettings();  const router = useRouter();
  const cart = useCart();
  const [overlay, , overlayReady] = useStore('products', {});
  const [session] = useStore('session', null);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [methodId, setMethodId] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // پر کردن نام از کاربر واردشده (فقط اگر کاربر هنوز چیزی ننوشته)
  useEffect(() => {
    if (session?.name) setForm((f) => (f.fullName ? f : { ...f, fullName: session.name }));
  }, [session?.name]);

  const all = useMemo(() => mergeCollection(products, overlay), [products, overlay]);
  const lines = useMemo(() => resolveLines(cart.items, all), [cart.items, all]);
  const totals = useMemo(() => calcTotals(lines, settings), [lines, settings]);
  const problems = lines.filter((l) => l.status !== 'ok').length;

  const methods = form.city ? getShippingMethods(settings, form.city) : [];
  const method = methods.find((m) => m.id === methodId) ?? methods[0] ?? null;
  const needsSlot = Boolean(method && method.etaDays[1] <= 1); // ارسال همان‌روز/فردا
  const slots = settings.shipping.timeSlots;
  const slot = needsSlot ? (slots.find((s) => s.id === slotId) ?? slots[0]) : null;

  const eta = useMemo(
    () => (method ? estimateDelivery(method, settings) : null),
    [method, settings]
  );
  const shippingCost = method ? calcShipping(totals.subtotal, method, settings) : 0;
  const total = totals.subtotal + shippingCost;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const bind = (key) => ({
    id: `co-${key}`,
    value: form[key],
    onChange: (e) => set(key, e.target.value),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `co-${key}-err` : undefined,
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;

    const errs = validate(form);
    setErrors(errs);
    setFormError('');
    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      document.getElementById(`co-${firstKey}`)?.focus();
      return;
    }

    setSubmitting(true);
    // تأخیر کوتاه برای حس واقعی بودن «در حال ثبت سفارش»
    timer.current = setTimeout(() => {
      try {
        const order = createOrder({
          lines,
          settings,
          customer: { fullName: form.fullName, mobile: form.mobile },
          address: { city: form.city, address: form.address, postalCode: form.postalCode },
          methodId: method.id,
          timeSlotId: slot?.id ?? null,
          note: form.note,
          userId: session?.id ?? null,
        });
        adjustStock(order.items.map((i) => ({ id: i.id, delta: -i.qty })), products);
        cart.clear();
        router.push(`/order/success/${order.trackingCode}`);      } catch (err) {
        setSubmitting(false);
        setFormError(err.message || 'ثبت سفارش با خطا مواجه شد.');
      }
    }, 1200);
  };

  if (!cart.ready || !overlayReady) return <Skeleton />;
  if (submitting) return <Processing />;

  if (lines.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-6xl" aria-hidden="true">🛒</p>
        <h2 className="mt-4 text-lg font-bold">سبد خرید شما خالی است</h2>
        <Link href="/products" className="btn-primary mt-6">مشاهده محصولات</Link>
      </div>
    );
  }

  if (problems > 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl" aria-hidden="true">⚠️</p>
        <h2 className="mt-4 text-lg font-bold">سبد خرید نیاز به اصلاح دارد</h2>
        <p className="mt-1 text-sm text-slate-500">
          {formatNumber(problems)} کالا ناموجود است یا تعدادش بیشتر از موجودی است.
        </p>
        <Link href="/cart" className="btn-primary mt-6">بازگشت به سبد خرید</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* مشخصات و آدرس */}
        <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="addr-title">
          <h2 id="addr-title" className="font-bold text-lajevard">۱. مشخصات و آدرس تحویل</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="co-fullName" label="نام و نام خانوادگی" error={errors.fullName}>
              <input className="input" autoComplete="name" {...bind('fullName')} />
            </Field>
            <Field id="co-mobile" label="شماره موبایل" error={errors.mobile}>
              <input
                className="input"
                dir="ltr"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="09123456789"
                {...bind('mobile')}
              />
            </Field>
            <Field id="co-city" label="شهر" error={errors.city}>
              <select className="input" autoComplete="address-level2" {...bind('city')}>
                <option value="">انتخاب کن...</option>
                {settings.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="co-postalCode" label="کد پستی" error={errors.postalCode} hint="۱۰ رقم، بدون خط تیره">
              <input
                className="input"
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                autoComplete="postal-code"
                {...bind('postalCode')}
              />
            </Field>
          </div>

          <Field id="co-address" label="آدرس کامل" error={errors.address} hint="خیابان، کوچه، پلاک، واحد">
            <textarea className="input min-h-24" rows={3} autoComplete="street-address" {...bind('address')} />
          </Field>

          <Field id="co-note" label="توضیحات سفارش (اختیاری)">
            <input className="input" maxLength={200} {...bind('note')} />
          </Field>
        </section>

        {/* ارسال */}
        <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="ship-title">
          <h2 id="ship-title" className="font-bold text-lajevard">۲. روش ارسال و زمان تحویل</h2>

          {methods.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              برای دیدن روش‌های ارسال و زمان تحویل، ابتدا شهر را انتخاب کن.
            </p>
          ) : (
            <>
              <div className="space-y-2" role="radiogroup" aria-label="روش ارسال">
                {methods.map((m) => {
                  const active = m.id === method?.id;
                  const cost = calcShipping(totals.subtotal, m, settings);
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        active ? 'border-firouzeh bg-firouzeh/5' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        className="h-4 w-4 accent-firouzeh"
                        checked={active}
                        onChange={() => setMethodId(m.id)}
                      />
                      <span className="flex-1 text-sm font-medium">{m.title}</span>
                      <span className={`text-sm ${cost === 0 ? 'font-medium text-firouzeh-dark' : 'text-slate-600'}`}>
                        {cost === 0 ? 'رایگان' : formatPrice(cost)}
                      </span>
                    </label>
                  );
                })}
              </div>

              {needsSlot && (
                <div>
                  <p className="mb-2 text-sm font-medium">بازه‌ی ساعتی تحویل</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="بازه ساعتی">
                    {slots.map((s) => {
                      const active = s.id === slot?.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSlotId(s.id)}
                          className={`rounded-full border px-4 py-1.5 text-sm transition ${
                            active
                              ? 'border-lajevard bg-lajevard text-white'
                              : 'border-slate-300 bg-white hover:border-lajevard'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {eta && (
                <p className="rounded-xl bg-lajevard-light p-3 text-sm text-lajevard-dark">
                  🚚 زمان تقریبی تحویل: <strong>{formatEta(eta)}</strong>
                  {slot && <> ، ساعت <strong>{slot.label}</strong></>}
                </p>
              )}
            </>
          )}
        </section>
      </div>

      {/* خلاصه و ثبت */}
      <aside className="card space-y-4 p-4 lg:sticky lg:top-28" aria-label="خلاصه سفارش">
        <h2 className="font-bold text-lajevard">خلاصه سفارش</h2>

        <ul className="max-h-56 space-y-3 overflow-y-auto pe-1">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <Image src={l.product.image} alt="" fill unoptimized sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">{l.product.name}</p>
                <p className="text-xs text-slate-400">
                  {formatNumber(l.qty)} عدد{l.color ? ` · ${l.color}` : ''}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs font-medium">{formatPrice(l.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">قیمت کالاها ({formatNumber(totals.itemCount)})</dt>
            <dd>{formatPrice(totals.originalTotal)}</dd>
          </div>
          {totals.discountTotal > 0 && (
            <div className="flex justify-between text-anar">
              <dt>سود شما از خرید</dt>
              <dd>−{formatPrice(totals.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">هزینه ارسال</dt>
            <dd className={method && shippingCost === 0 ? 'font-medium text-firouzeh-dark' : ''}>
              {!method ? '—' : shippingCost === 0 ? 'رایگان' : formatPrice(shippingCost)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
            <dt>مبلغ قابل پرداخت</dt>
            <dd className="text-lajevard">{formatPrice(total)}</dd>
          </div>
        </dl>

        {formError && (
          <p className="rounded-xl bg-red-50 p-3 text-xs text-anar" role="alert">{formError}</p>
        )}
        {Object.values(errors).some(Boolean) && (
          <p className="text-xs text-anar" role="alert">لطفاً فیلدهای علامت‌دار را اصلاح کن.</p>
        )}

        <button type="submit" className="btn-accent w-full" disabled={!method}>
          پرداخت و ثبت نهایی سفارش
        </button>
        <p className="text-center text-xs text-slate-400">
          پروژه‌ی نمایشی؛ پرداخت واقعی انجام نمی‌شود.
        </p>
        <Link href="/cart" className="block text-center text-sm text-firouzeh-dark hover:underline">
          بازگشت به سبد خرید
        </Link>
      </aside>
    </form>
  );
}