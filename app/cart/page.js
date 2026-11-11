import CartView from '@/components/CartView';
import { getProducts, getSettings } from '@/services/products.server';

export const metadata = {
  title: 'سبد خرید',
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <div className="container py-6">
      <h1 className="mb-4 text-2xl font-bold text-lajevard">سبد خرید</h1>
      <CartView products={products} settings={settings} />
    </div>
  );
}