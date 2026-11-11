'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSettings } from '@/hooks/useCatalog';  
import { useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import { useStore } from '@/hooks/useStore';
import { mergeCollection } from '@/services/dataService';
import { resolveLines, calcTotals } from '@/services/cartService';
import { formatNumber, formatPrice } from '@/lib/format';

const PROBLEM_TEXT = {
  missing: 'این کالا دیگر در فروشگاه موجود نیست.',
  out: 'این کالا ناموجود شده است.',
};

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-busy="true">
      <div className="space-y-3 lg:col-span-2">
        {[0, 1].map((i) => <div key={i} className="card h-36 animate-pulse bg-slate-100" />)}
      </div>
      <div className="card h-64 animate-pulse bg-slate-100" />
    </div>
  );
}

function QtyStepper({ line, onChange }) {
  return (
    <div className="flex items-center rounded-xl border border-slate-300 bg-white" role="group" aria-label="تعداد">
      <button
        type="button"
        className="h-9 w-9 text-lg disabled:opacity-30"
        onClick={() => onChange(line.qty - 1)}
        disabled={line.status === 'missing' || line.status === 'out'}
        aria-label="کاهش تعداد"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-medium" aria-live="polite">{formatNumber(line.qty)}</span>
      <button
        type="button"
        className="h-9 w-9 text-lg disabled:opacity-30"
        onClick={() => onChange(line.qty + 1)}
        disabled={line.status !== 'ok' || line.qty >= line.maxQty}
        aria-label="افزایش تعداد"
      >
        +
      </button>
    </div>
  );
}

export default function CartView({ products }) {     // ② settings حذف شد
  const settings = useSettings();                    // ③ اولین خط بدنه
  const cart = useCart();
  const [overlay, , overlayReady] = useStore('products', {}); // تغییرات پنل ادمین

  const all = useMemo(() => mergeCollection(products, overlay), [products, overlay]);
  const lines = useMemo(() => resolveLines(cart.items, all), [cart.items, all]);
  const totals = useMemo(() => calcTotals(lines, settings), [lines, settings]);
  const problems = lines.filter((l) => l.status !== 'ok').length;

  if (!cart.ready || !overlayReady) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-6xl" aria-hidden="true">🛒</p>
        <h2 className="mt-4 text-lg font-bold">سبد خرید شما خالی است</h2>
        <p className="mt-1 text-sm text-slate-500">برای شروع، محصولات مورد علاقه‌ات را اضافه کن.</p>
        <Link href="/products" className="btn-primary mt-6">مشاهده محصولات</Link>
      </div>
    );
  }

  const clearAll = () => {
    if (window.confirm('همه‌ی کالاهای سبد حذف شوند؟')) cart.clear();
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      {/* لیست اقلام */}
      <section className="space-y-3 lg:col-span-2" aria-label="اقلام سبد خرید">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{formatNumber(cart.count)} کالا در سبد</p>
          <button type="button" onClick={clearAll} className="text-sm text-anar hover:underline">
            خالی کردن سبد
          </button>
        </div>

        {lines.map((line) => {
          const p = line.product;
          const bad = line.status !== 'ok';
          return (
            <article key={line.key} className={`card flex gap-3 p-3 sm:gap-4 sm:p-4 ${bad ? 'border-anar/40 bg-red-50/40' : ''}`}>
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                {p && (
                  <Image src={p.image} alt={p.name} fill unoptimized sizes="112px" className="object-cover" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {p ? (
                  <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-medium leading-6 hover:text-lajevard">
                    {p.name}
                  </Link>
                ) : (
                  <p className="text-sm text-slate-500">کالای حذف‌شده</p>
                )}

                {line.color && <p className="text-xs text-slate-500">رنگ: {line.color}</p>}

                {line.status === 'limited' && (
                  <p className="text-xs text-anar" role="alert">
                    فقط {formatNumber(p.stock)} عدد موجود است.{' '}
                    <button
                      type="button"
                      className="font-medium underline"
                      onClick={() => cart.setQty(line.id, line.maxQty, line.color)}
                    >
                      اصلاح تعداد
                    </button>
                  </p>
                )}
                {PROBLEM_TEXT[line.status] && (
                  <p className="text-xs text-anar" role="alert">{PROBLEM_TEXT[line.status]}</p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <QtyStepper line={line} onChange={(q) => cart.setQty(line.id, q, line.color)} />
                  <div className="text-end">
                    {!bad && p.discount > 0 && (
                      <p className="text-xs text-slate-400 line-through">{formatPrice(p.price * line.qty)}</p>
                    )}
                    {!bad && <p className="font-bold text-lajevard">{formatPrice(line.lineTotal)}</p>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => cart.remove(line.id, line.color)}
                className="self-start text-slate-400 hover:text-anar"
                aria-label="حذف از سبد"
                title="حذف"
              >
                ✕
              </button>
            </article>
          );
        })}
      </section>

      {/* خلاصه سفارش */}
      <aside className="card space-y-4 p-4 lg:sticky lg:top-28" aria-label="خلاصه سفارش">
        <h2 className="font-bold text-lajevard">خلاصه سفارش</h2>

        <div>
          <p className="mb-1.5 text-xs text-slate-600">
            {totals.freeShipping
              ? '🎉 ارسال سفارش شما رایگان است'
              : `${formatPrice(totals.remainingForFree)} تا ارسال رایگان باقی مانده`}
          </p>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(totals.freeProgress)}
            aria-label="پیشرفت تا ارسال رایگان"
          >
            <div
              className="h-full rounded-full bg-firouzeh transition-all"
              style={{ width: `${totals.freeProgress}%` }}
            />
          </div>
        </div>

        <dl className="space-y-2 text-sm">
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
            <dd className={totals.freeShipping ? 'font-medium text-firouzeh-dark' : 'text-slate-600'}>
              {totals.freeShipping ? 'رایگان' : `از ${formatPrice(totals.cheapestShipping)}`}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
            <dt>جمع کالاها</dt>
            <dd className="text-lajevard">{formatPrice(totals.subtotal)}</dd>
          </div>
        </dl>

        {!totals.freeShipping && (
          <p className="text-xs text-slate-400">هزینه‌ی دقیق ارسال در مرحله‌ی بعد، با انتخاب روش ارسال، محاسبه می‌شود.</p>
        )}

        {problems > 0 && (
          <p className="rounded-xl bg-red-50 p-3 text-xs text-anar" role="alert">
            برای ادامه، ابتدا مشکل {formatNumber(problems)} کالای علامت‌دار را برطرف کن (اصلاح تعداد یا حذف).
          </p>
        )}

        <Link
          href="/checkout"
          aria-disabled={problems > 0 || totals.itemCount === 0}
          className={`btn-accent w-full ${problems > 0 || totals.itemCount === 0 ? 'pointer-events-none opacity-50' : ''}`}
        >
          ادامه و ثبت سفارش
        </Link>
        <Link href="/products" className="block text-center text-sm text-firouzeh-dark hover:underline">
          ادامه‌ی خرید
        </Link>
      </aside>
    </div>
  );
}