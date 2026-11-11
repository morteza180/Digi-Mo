import ProductsExplorer from '@/components/ProductsExplorer';
import { getProducts, getCategories } from '@/services/products.server';

export const metadata = {
  title: 'همه محصولات',
  description: 'لیست موبایل، شارژر، پاوربانک، هدفون و کاور با امکان فیلتر و مقایسه',
};

const pick = (v) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function ProductsPage({ searchParams }) {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="container py-6">
      <h1 className="mb-4 text-2xl font-bold text-lajevard">محصولات</h1>
      <ProductsExplorer
        products={products}
        categories={categories}
        initialCategory={pick(searchParams?.category) || 'all'}
        initialQuery={pick(searchParams?.q)}
      />
    </div>
  );
}