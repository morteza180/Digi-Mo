import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: { default: 'پنل مدیریت', template: '%s | پنل مدیریت' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute role="admin">
      <div className="container grid items-start gap-6 py-6 lg:grid-cols-[14rem_1fr]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </ProtectedRoute>
  );
}