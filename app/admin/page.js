import AdminDashboard from '@/components/admin/AdminDashboard';
import { getProducts } from '@/services/products.server';

export const metadata = { title: 'داشبورد' };

export default async function AdminPage() {
  const products = await getProducts();

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">داشبورد</h1>
      <AdminDashboard products={products} />
    </>
  );
}