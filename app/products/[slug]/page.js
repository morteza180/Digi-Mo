import Link from 'next/link';
import ProductLive from '@/components/ProductLive';
import ProductCard from '@/components/ProductCard';
import { getProducts, getProductBySlug, getCategories } from '@/services/products.server';
import { calcFinalPrice } from '@/lib/format';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const p = await getProductBySlug(params.slug);

  // کالاهای اضافه‌شده توسط ادمین سمت سرور وجود ندارن؛ ایندکس نشن
  if (!p) return { title: 'محصول', robots: { index: false, follow: false } };

  return {
    title: p.name,
    description: p.shortDescription,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type: 'website',
      title: p.name,
      description: p.shortDescription,
      images: [{ url: p.image, width: 800, height: 800, alt: p.name }],
    },
  };
}

export default async function ProductPage({ params }) {
  const [product, products, categories] = await Promise.all([
    getProductBySlug(params.slug),
    getProducts(),
    getCategories(),
  ]);

  const category = categories.find((c) => c.slug === product?.category);
  const related = product
    ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  const jsonLd = product && [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.shortDescription,
      image: [`${SITE_URL}${product.image}`],
      sku: product.id,
      brand: { '@type': 'Brand', name: product.brandName },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/products/${product.slug}`,
        priceCurrency: 'IRR', // ریال؛ قیمت‌های ما تومان هستن
        price: calcFinalPrice(product.price, product.discount) * 10,
        availability:
          product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: category?.name ?? 'محصولات', item: `${SITE_URL}/products?category=${product.category}` },
        { '@type': 'ListItem', position: 3, name: product.name },
      ],
    },
  ];

  return (
    <div className="container py-6">
      {jsonLd && (
        <script
          type="application/ld+json"
          // escape کردن < جلوی بسته شدن زودهنگام تگ script رو می‌گیره
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}

      <nav aria-label="مسیر صفحه" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-lajevard">خانه</Link>
        <span aria-hidden="true">/</span>
        <Link href="/products" className="hover:text-lajevard">محصولات</Link>
        {product && category && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/products?category=${category.slug}`} className="hover:text-lajevard">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <ProductLive product={product ?? null} slug={params.slug} categories={categories} />

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-4 text-lg font-bold text-lajevard">کالاهای مشابه</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}