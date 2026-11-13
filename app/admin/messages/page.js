import AdminMessagesView from '@/components/admin/AdminMessagesView';

export const metadata = { title: 'پیام‌ها' };

export default function AdminMessagesPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">پیام‌های تماس</h1>
      <AdminMessagesView />
    </>
  );
}