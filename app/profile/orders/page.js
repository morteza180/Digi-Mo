import ProtectedRoute from '@/components/ProtectedRoute';
import OrdersList from '@/components/OrdersList';

export const metadata = {
  title: 'سفارش‌های من',
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold text-lajevard">سفارش‌های من</h1>
        <OrdersList />
      </div>
    </ProtectedRoute>
  );
}