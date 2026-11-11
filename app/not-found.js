import Link from 'next/link';

export const metadata = { title: 'صفحه پیدا نشد' };

export default function NotFound() {
  return (
    <section className="container py-20 text-center">
      <p className="text-6xl" aria-hidden="true">🧭</p>
      <h1 className="mt-4 text-2xl font-bold text-lajevard">صفحه‌ی مورد نظر پیدا نشد</h1>
      <p className="mt-2 text-slate-500">آدرس اشتباه است یا این صفحه حذف شده.</p>
      <Link href="/" className="btn-primary mt-6">بازگشت به خانه</Link>
    </section>
  );
}
