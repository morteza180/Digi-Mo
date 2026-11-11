import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileView from '@/components/ProfileView';

export const metadata = {
  title: 'حساب کاربری',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold text-lajevard">حساب کاربری</h1>
        <ProfileView />
      </div>
    </ProtectedRoute>
  );
}