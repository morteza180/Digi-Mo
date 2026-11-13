import AdminOrdersView from '@/components/admin/AdminOrdersView';
import { getProducts } from '@/services/products.server';

export const metadata = { title: 'سفارش‌ها' };

export default async function AdminOrdersPage() {
  const products = await getProducts();

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">مدیریت سفارش‌ها</h1>
      <AdminOrdersView products={products} />
    </>
  );
}