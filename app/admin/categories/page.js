import AdminCategoriesView from '@/components/admin/AdminCategoriesView';
import { getProducts } from '@/services/products.server';

export const metadata = { title: 'دسته‌بندی‌ها' };

export default async function AdminCategoriesPage() {
  const products = await getProducts();

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">مدیریت دسته‌بندی‌ها</h1>
      <AdminCategoriesView products={products} />
    </>
  );
}