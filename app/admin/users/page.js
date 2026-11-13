import AdminUsersView from '@/components/admin/AdminUsersView';

export const metadata = { title: 'کاربران' };

export default function AdminUsersPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">مدیریت کاربران</h1>
      <AdminUsersView />
    </>
  );
}