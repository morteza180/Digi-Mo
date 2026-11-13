import ProtectedRoute from '@/components/ProtectedRoute';
import WishlistView from '@/components/WishlistView';
import { getProducts } from '@/services/products.server';

export const metadata = {
  title: 'ذخیره‌های من',
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const products = await getProducts();

  return (
    <ProtectedRoute>
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold text-lajevard">ذخیره‌های من</h1>
        <WishlistView products={products} />
      </div>
    </ProtectedRoute>
  );
}