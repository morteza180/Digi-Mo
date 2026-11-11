'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/hooks/useStore';
import { mergeCollection } from '@/services/dataService';
import { calcFinalPrice, formatNumber, normalizeFa } from '@/lib/format';
import { useCategories } from '@/hooks/useCatalog';


const SORTS = {
  newest: { label: 'جدیدترین', fn: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  cheapest: { label: 'ارزان‌ترین', fn: (a, b) => calcFinalPrice(a.price, a.discount) - calcFinalPrice(b.price, b.discount) },
  expensive: { label: 'گران‌ترین', fn: (a, b) => calcFinalPrice(b.price, b.discount) - calcFinalPrice(a.price, a.discount) },
  discount: { label: 'بیشترین تخفیف', fn: (a, b) => b.discount - a.discount },
  rating: { label: 'بیشترین امتیاز', fn: (a, b) => b.rating - a.rating },
};

export default function ProductsExplorer({ products, initialCategory = 'all', initialQuery = '' }) {
  const categories = useCategories();  const [overlay] = useStore('products', {}); // تغییرات پنل ادمین روی داده‌ی سرور
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState('newest');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // وقتی جستجوی Navbar آدرس رو عوض کرد (props جدید از سرور)
  useEffect(() => setCategory(initialCategory), [initialCategory]);
  useEffect(() => setQuery(initialQuery), [initialQuery]);
  useEffect(() => setBrand('all'), [category]);

  const all = useMemo(() => mergeCollection(products, overlay), [products, overlay]);

  const inCategory = useMemo(
    () => (category === 'all' ? all : all.filter((p) => p.category === category)),
    [all, category]
  );

  const brands = useMemo(() => {
    const map = new Map();
    inCategory.forEach((p) => map.set(p.brand, p.brandName));
    return [...map.entries()];
  }, [inCategory]);

  const list = useMemo(() => {
    const q = normalizeFa(query);
    return inCategory
      .filter((p) => (brand === 'all' ? true : p.brand === brand))
      .filter((p) => (onlyAvailable ? p.stock > 0 : true))
      .filter((p) => !q || normalizeFa(`${p.name} ${p.brandName} ${p.brand}`).includes(q))
      .sort(SORTS[sort].fn);
  }, [inCategory, brand, onlyAvailable, query, sort]);

  const chip = (active) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
      active ? 'border-lajevard bg-lajevard text-white' : 'border-slate-300 bg-white hover:border-lajevard'
    }`;

  return (
    <div className="space-y-4">
      {/* دسته‌ها */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" className={chip(category === 'all')} onClick={() => setCategory('all')}>
          همه ({formatNumber(all.length)})
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" className={chip(category === c.slug)} onClick={() => setCategory(c.slug)}>
            {c.icon} {c.name} ({formatNumber(all.filter((p) => p.category === c.slug).length)})
          </button>
        ))}
      </div>

      {/* ابزار فیلتر */}
      <div className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="جستجو در نتایج..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="جستجو"
        />
        <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="برند">
          <option value="all">همه برندها</option>
          {brands.map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="مرتب‌سازی">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-firouzeh"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          فقط کالاهای موجود
        </label>
      </div>

      <p className="text-sm text-slate-500">{formatNumber(list.length)} کالا یافت شد</p>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          <p className="text-4xl" aria-hidden="true">🔍</p>
          <p className="mt-2">کالایی با این مشخصات پیدا نشد.</p>
          <button
            type="button"
            className="btn-outline mt-4"
            onClick={() => { setQuery(''); setBrand('all'); setCategory('all'); setOnlyAvailable(false); }}
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}