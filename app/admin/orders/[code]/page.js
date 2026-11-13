import AdminOrderDetail from '@/components/admin/AdminOrderDetail';
import { getProducts } from '@/services/products.server';

export const metadata = { title: 'جزئیات سفارش' };

export default async function AdminOrderPage({ params }) {
  const products = await getProducts();

  return <AdminOrderDetail trackingCode={decodeURIComponent(params.code)} products={products} />;
}