import AdminSettingsView from '@/components/admin/AdminSettingsView';
import { getProducts } from '@/services/products.server';

export const metadata = { title: 'تنظیمات' };

export default async function AdminSettingsPage() {
  const products = await getProducts(); // فقط برای «خروجی JSON محصولات»

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">تنظیمات فروشگاه</h1>
      <AdminSettingsView products={products} />
    </>
  );
}