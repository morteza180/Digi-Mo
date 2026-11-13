import AdminProductsView from '@/components/admin/AdminProductsView';
import { getProducts, getCategories } from '@/services/products.server';

export const metadata = { title: 'محصولات' };

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">مدیریت محصولات</h1>
      <AdminProductsView products={products} categories={categories} />
    </>
  );
}