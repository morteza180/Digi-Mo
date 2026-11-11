'use client';

import Image from 'next/image';
import Link from 'next/link';
import Price from '@/components/ui/Price';
import { IconHeart, IconScale } from '@/components/ui/Icons';
import { useCart } from '@/hooks/useCart';
import { useWishlist, useCompare } from '@/hooks/useLists';
import { formatNumber } from '@/lib/format';

export default function ProductCard({ product }) {
  const cart = useCart();
  const wish = useWishlist();
  const cmp = useCompare();

  const out = product.stock <= 0;
  const inWish = wish.has(product.id);
  const inCmp = cmp.has(product.id);

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-square bg-slate-100">
        <Link href={`/products/${product.slug}`} aria-label={product.name}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized /* SVG placeholder؛ با عکس webp واقعی بردار */
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        </Link>

        <div className="absolute end-2 top-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => wish.toggle(product.id)}
            aria-pressed={inWish}
            aria-label={inWish ? 'حذف از ذخیره‌ها' : 'افزودن به ذخیره‌ها'}
            className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow transition hover:bg-white ${
              inWish ? 'text-anar' : 'text-slate-500'
            }`}
          >
            <IconHeart filled={inWish} width={18} height={18} />
          </button>
          <button
            type="button"
            onClick={() => cmp.toggle(product.id)}
            disabled={cmp.full && !inCmp}
            aria-pressed={inCmp}
            aria-label="مقایسه"
            title={cmp.full && !inCmp ? 'حداکثر ۴ کالا قابل مقایسه است' : 'مقایسه'}
            className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow transition hover:bg-white disabled:opacity-40 ${
              inCmp ? 'text-firouzeh-dark' : 'text-slate-500'
            }`}
          >
            <IconScale width={18} height={18} />
          </button>
        </div>

        {out && (
          <span className="absolute start-2 top-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-white">
            ناموجود
          </span>
        )}
        {!out && product.stock <= 5 && (
          <span className="absolute start-2 top-2 rounded-full bg-zaferan px-2 py-0.5 text-xs font-medium">
            تنها {formatNumber(product.stock)} عدد
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="text-xs text-slate-500">{product.brandName}</div>
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.75rem] text-sm font-medium leading-6 hover:text-lajevard"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2">
          <Price price={product.price} discount={product.discount} />
          {product.reviewCount > 0 && (
            <span className="whitespace-nowrap text-xs text-slate-500">
                ⭐ {formatNumber(product.rating)}
            </span>
            )}
        </div>

        <button
          type="button"
          disabled={out}
          onClick={() => cart.add(product.id, 1, product.colors?.[0]?.name ?? null)}
          className={out ? 'btn-outline' : cart.has(product.id) ? 'btn-accent' : 'btn-primary'}
        >
          {out ? 'ناموجود' : cart.has(product.id) ? 'یکی دیگه اضافه کن' : 'افزودن به سبد'}
        </button>
      </div>
    </article>
  );
}