'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useLists';
import { formatNumber } from '@/lib/format';
import { SITE_NAME } from '@/lib/constants';
import { IconCart, IconHeart, IconUser, IconSearch, IconMenu, IconClose } from '@/components/ui/Icons';
import { useCategories } from '@/hooks/useCatalog';


function Badge({ n }) {
  if (!n) return null;
  return (
    <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-anar px-1 text-[11px] font-bold text-white">
      {formatNumber(n)}
    </span>
  );
}

export default function Navbar() {
  const categories = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [session] = useStore('session', null);
  const cart = useCart();
  const wish = useWishlist();

  useEffect(() => setOpen(false), [pathname]); // بستن منو بعد از تغییر مسیر

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  const iconLink = 'relative grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      {/* ردیف اول */}
      <div className="container flex items-center gap-3 py-3">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="منو"
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>

        <Link href="/" className="whitespace-nowrap text-xl font-bold text-lajevard">
          📱 {SITE_NAME}
        </Link>

        <form onSubmit={submit} role="search" className="relative mx-auto hidden max-w-xl flex-1 md:block">
          <input
            className="input ps-11"
            placeholder="جستجوی موبایل، شارژر، هدفون..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="جستجو"
          />
          <button type="submit" aria-label="جستجو" className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500">
            <IconSearch width={20} height={20} />
          </button>
        </form>

        <nav className="ms-auto flex items-center gap-1 md:ms-0" aria-label="دسترسی سریع">
          <Link href={session ? '/profile' : '/login'} className={`${iconLink} w-auto gap-2 px-3`}>
            <IconUser />
            <span className="hidden text-sm sm:inline">{session?.name ?? 'ورود | ثبت‌نام'}</span>
          </Link>
          <Link href="/wishlist" className={iconLink} aria-label="ذخیره‌ها">
            <IconHeart />
            <Badge n={wish.ids.length} />
          </Link>
          <Link href="/cart" className={iconLink} aria-label="سبد خرید">
            <IconCart />
            <Badge n={cart.count} />
          </Link>
        </nav>
      </div>

      {/* ردیف دوم: دسته‌بندی‌ها (دسکتاپ) */}
      <div className="hidden border-t border-slate-100 lg:block">
        <nav className="container flex items-center gap-6 py-2 text-sm" aria-label="دسته‌بندی‌ها">
          <Link href="/products" className="font-medium text-lajevard hover:underline">همه محصولات</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className="text-slate-600 hover:text-lajevard">
              {c.icon} {c.name}
            </Link>
          ))}
          <Link href="/about" className="ms-auto text-slate-500 hover:text-lajevard">درباره ما</Link>
          <Link href="/contact" className="text-slate-500 hover:text-lajevard">تماس با ما</Link>
        </nav>
      </div>

      {/* منوی موبایل */}
      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className="container space-y-4 py-4">
            <form onSubmit={submit} role="search" className="relative md:hidden">
              <input
                className="input ps-11"
                placeholder="جستجو..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="جستجو"
              />
              <button type="submit" aria-label="جستجو" className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500">
                <IconSearch width={20} height={20} />
              </button>
            </form>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/products?category=${c.slug}`} className="block rounded-xl bg-slate-50 px-3 py-2.5 hover:bg-lajevard-light">
                    {c.icon} {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-4 text-sm text-slate-600">
              <Link href="/about">درباره ما</Link>
              <Link href="/contact">تماس با ما</Link>
              <Link href="/compare">مقایسه</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}