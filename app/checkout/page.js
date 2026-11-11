import ProtectedRoute from '@/components/ProtectedRoute';
import CheckoutView from '@/components/CheckoutView';
import { getProducts, getSettings } from '@/services/products.server';

export const metadata = {
  title: 'تکمیل خرید',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <ProtectedRoute>
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold text-lajevard">تکمیل خرید</h1>
        <CheckoutView products={products} settings={settings} />
      </div>
    </ProtectedRoute>
  );
}