import ContactView from '@/components/ContactView';

export const metadata = {
  title: 'تماس با ما',
  description: 'پیام، پیشنهاد یا سؤال خودت را برای دیجی مو بفرست.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-1 text-2xl font-bold text-lajevard">تماس با ما</h1>
      <p className="mb-6 text-sm text-slate-500">سؤال، پیشنهاد یا انتقادت را بنویس تا بررسی کنیم.</p>
      <ContactView />
    </div>
  );
}