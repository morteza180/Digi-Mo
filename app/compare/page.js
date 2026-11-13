import CompareView from '@/components/CompareView';
import { getProducts, getCategories } from '@/services/products.server';

export const metadata = {
  title: 'مقایسه محصولات',
  robots: { index: false, follow: false },
};

export default async function ComparePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="container py-6">
      <h1 className="mb-4 text-2xl font-bold text-lajevard">مقایسه محصولات</h1>
      <CompareView products={products} categories={categories} />
    </div>
  );
}