import AdminOrderDetail from '@/components/admin/AdminOrderDetail';
import { getProducts } from '@/services/products.server';
import { readFileSync } from "fs"
import path from "path"
import { json } from 'stream/consumers';

export const metadata = { title: 'جزئیات سفارش' };


export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), "public", "data", "categories.json")
  const orders = JSON.parse(readFileSync(filePath, 'utf-8'))

  return orders.map((category) => ({
    id: String(category.id)
  })
  )
}

export default async function AdminOrderPage({ params }) {
  const products = await getProducts();

  return <AdminOrderDetail trackingCode={decodeURIComponent(params.code)} products={products} />;
}