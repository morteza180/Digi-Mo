import ProtectedRoute from '@/components/ProtectedRoute';
import OrderSuccess from '@/components/OrderSuccess';

export const metadata = {
  title: 'سفارش با موفقیت ثبت شد',
  robots: { index: false, follow: false },
};

export default function OrderSuccessPage({ params }) {
  return (
    <ProtectedRoute>
      <div className="container py-8">
        <OrderSuccess trackingCode={decodeURIComponent(params.trackingCode)} />
      </div>
    </ProtectedRoute>
  );
}