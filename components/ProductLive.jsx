'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AddToCartButton from '@/components/AddToCartButton';
import Price from '@/components/ui/Price';
import { IconHeart, IconScale } from '@/components/ui/Icons';
import { useStore } from '@/hooks/useStore';
import { useWishlist, useCompare } from '@/hooks/useLists';
import { mergeCollection } from '@/services/dataService';
import { formatNumber } from '@/lib/format';
import { useCategories } from '@/hooks/useCatalog';


function formatSpec(item, value) {
  if (item.type === 'bool') return value ? 'بله' : 'خیر';
  if (typeof value === 'number') return `${formatNumber(value)}${item.unit ? ` ${item.unit}` : ''}`;
  return String(value);
}

export default function ProductLive({ product: base, slug }) {
  const categories = useCategories();  const [overlay, , ready] = useStore('products', {});
  const wish = useWishlist();
  const cmp = useCompare();
  const [colorName, setColorName] = useState(null);

  // رندر اول = داده‌ی سرور؛ بعد از mount تغییرات ادمین اعمال میشه
  const product = useMemo(
    () => mergeCollection(base ? [base] : [], overlay).find((p) => p.slug === slug),
    [base, overlay, slug]
  );

  if (!product) {
    // کالایی که ادمین اضافه کرده تو سرور وجود نداره؛ تا خوندن localStorage اسکلتون نشون بده
    if (!base && !ready) {
      return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;
    }
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl" aria-hidden="true">📭</p>
        <h1 className="mt-3 text-xl font-bold">این کالا پیدا نشد یا حذف شده است</h1>
        <Link href="/products" className="btn-primary mt-5">بازگشت به محصولات</Link>
      </div>
    );
  }

  const colors = product.colors ?? [];
  const selected = colors.find((c) => c.name === colorName) ?? colors[0];
  const out = product.stock <= 0;
  const inWish = wish.has(product.id);
  const inCmp = cmp.has(product.id);
  const schema = categories.find((c) => c.slug === product.category)?.specSchema ?? [];
  const specRows = schema.filter((s) => product.specs?.[s.key] != null);

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-2">
        {/* گالری */}
        <div className="card relative aspect-square overflow-hidden bg-slate-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            unoptimized /* SVG placeholder؛ با عکس webp واقعی بردار */
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          {product.discount > 0 && (
            <span className="absolute start-3 top-3 rounded-full bg-anar px-3 py-1 text-sm font-bold text-white">
              {formatNumber(product.discount)}٪ تخفیف
            </span>
          )}
          <div className="absolute end-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => wish.toggle(product.id)}
              aria-pressed={inWish}
              aria-label={inWish ? 'حذف از ذخیره‌ها' : 'افزودن به ذخیره‌ها'}
              className={`grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white ${
                inWish ? 'text-anar' : 'text-slate-500'
              }`}
            >
              <IconHeart filled={inWish} width={20} height={20} />
            </button>
            <button
              type="button"
              onClick={() => cmp.toggle(product.id)}
              disabled={cmp.full && !inCmp}
              aria-pressed={inCmp}
              aria-label="مقایسه"
              title={cmp.full && !inCmp ? 'حداکثر ۴ کالا قابل مقایسه است' : 'مقایسه'}
              className={`grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white disabled:opacity-40 ${
                inCmp ? 'text-firouzeh-dark' : 'text-slate-500'
              }`}
            >
              <IconScale width={20} height={20} />
            </button>
          </div>
        </div>

        {/* اطلاعات */}
        <div className="space-y-5">
          <div>
            <Link
              href={`/products?category=${product.category}`}
              className="text-sm text-firouzeh-dark hover:underline"
            >
              {product.brandName}
            </Link>
            <h1 className="mt-1 text-xl font-bold leading-9 md:text-2xl">{product.name}</h1>
            {product.reviewCount > 0 && (
            <p className="mt-2 text-sm text-slate-500">
                ⭐ {formatNumber(product.rating)} ({formatNumber(product.reviewCount)} نظر)
            </p>
            )}
          </div>

          <p className="leading-8 text-slate-600">{product.shortDescription}</p>

          {colors.length > 0 && (
            <div>
              <p className="mb-2 text-sm">
                رنگ: <strong>{selected?.name}</strong>
              </p>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="انتخاب رنگ">
                {colors.map((c) => {
                  const active = c.name === selected?.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={c.name}
                      title={c.name}
                      onClick={() => setColorName(c.name)}
                      className={`h-9 w-9 rounded-full border-2 transition ${
                        active ? 'border-lajevard ring-2 ring-firouzeh/40 ring-offset-2' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="card space-y-4 p-4">
            <div className="flex items-end justify-between gap-3">
              <Price price={product.price} discount={product.discount} large />
              <span
                className={`text-sm font-medium ${
                  out ? 'text-anar' : product.stock <= 5 ? 'text-orange-600' : 'text-firouzeh-dark'
                }`}
              >
                {out
                  ? 'ناموجود'
                  : product.stock <= 5
                    ? `تنها ${formatNumber(product.stock)} عدد در انبار`
                    : 'موجود در انبار'}
              </span>
            </div>
            <AddToCartButton product={product} color={selected?.name ?? null} />
            <p className="text-xs text-slate-400">قیمت‌ها نمونه و صرفاً برای نمایش پروژه هستند.</p>
          </div>

          <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {product.warranty && <li>🛡️ {product.warranty}</li>}
            <li>✅ ضمانت اصالت کالا</li>
            <li>🚚 ارسال سریع (پیک فوری در تهران)</li>
            <li>↩️ بازگشت ۷ روزه</li>
          </ul>
        </div>
      </section>

      {/* مشخصات فنی */}
      {specRows.length > 0 && (
        <section className="mt-10" aria-labelledby="specs-title">
          <h2 id="specs-title" className="mb-3 text-lg font-bold text-lajevard">مشخصات فنی</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {specRows.map((s, i) => (
                  <tr key={s.key} className={i % 2 ? 'bg-white' : 'bg-slate-50'}>
                    <th scope="row" className="w-2/5 px-4 py-3 text-start font-medium text-slate-500">
                      {s.label}
                    </th>
                    <td className="px-4 py-3">{formatSpec(s, product.specs[s.key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}