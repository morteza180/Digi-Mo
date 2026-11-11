'use client';

import Link from 'next/link';
import { useCategories, useSettings } from '@/hooks/useCatalog';

export default function Footer() {
  const { shop } = useSettings();
  const categories = useCategories();

  return (
    <footer className="mt-16 bg-lajevard-dark text-slate-200 print:hidden">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-lg font-bold text-white">📱 {shop.name}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">{shop.slogan}</p>
        </div>

        <div>
          <h3 className="mb-3 font-medium text-white">دسته‌بندی‌ها</h3>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/products?category=${c.slug}`} className="hover:text-zaferan">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-medium text-white">دسترسی سریع</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-zaferan">درباره ما</Link></li>
            <li><Link href="/contact" className="hover:text-zaferan">تماس با ما</Link></li>
            <li><Link href="/compare" className="hover:text-zaferan">مقایسه محصولات</Link></li>
            <li><Link href="/profile/orders" className="hover:text-zaferan">پیگیری سفارش</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-medium text-white">تماس</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone preview-icon"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg> {shop.phone}</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail preview-icon"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg> {shop.email}</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-house preview-icon"><path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/><path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/><path d="M18 22v-3"/><circle cx="10" cy="10" r="3"/></svg> {shop.address}</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock preview-icon"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> {shop.workingHours}</li>
            {shop.instagram && <li>📷 <span dir="ltr">@{shop.instagram}</span></li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        این فروشگاه یک پروژه نمایشی (نمونه‌کار) است؛ قیمت‌ها و کالاها واقعی نیستند.
      </div>
    </footer>
  );
}