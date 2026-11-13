import Link from 'next/link';
import ShopInfo from '@/components/ShopInfo';
import { getProducts, getCategories } from '@/services/products.server';
import { formatNumber } from '@/lib/format';

export const metadata = {
  title: 'درباره ما',
  description: 'با دیجی مو، فروشگاه آنلاین تخصصی موبایل و لوازم جانبی، بیشتر آشنا شو.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { icon: '✅', title: 'اصالت کالا', text: 'تمرکز ما روی کالای اصل و گارانتی‌دار است و مشخصات هر کالا شفاف نمایش داده می‌شود.' },
  { icon: '⚖️', title: 'انتخاب آگاهانه', text: 'ابزار مقایسه کمک می‌کند تا چند کالا را عددی و کنار هم ببینی و بهترین مقدار هر ویژگی را تشخیص بدهی.' },
  { icon: '🚚', title: 'ارسال شفاف', text: 'هزینه‌ی ارسال و بازه‌ی تقریبی تحویل، قبل از ثبت نهایی سفارش مشخص است.' },
  { icon: '💬', title: 'پشتیبانی پاسخگو', text: 'پیام‌هایت از طریق فرم تماس بررسی می‌شود و برای پیگیری، کد مرجع می‌گیری.' },
];

const STEPS = [
  { n: '۱', title: 'انتخاب و مقایسه', text: 'کالا را جستجو کن، فیلتر بزن و تا ۴ مورد را مقایسه کن.' },
  { n: '۲', title: 'سبد و ثبت سفارش', text: 'آدرس، روش ارسال و بازه‌ی تحویل را انتخاب کن.' },
  { n: '۳', title: 'پیگیری', text: 'با کد پیگیری، مراحل آماده‌سازی و ارسال را ببین.' },
];

export default async function AboutPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const brandCount = new Set(products.map((p) => p.brand)).size;

  const stats = [
    { label: 'کالا در این نمونه', value: products.length },
    { label: 'برند', value: brandCount },
    { label: 'دسته‌بندی', value: categories.length },
  ];

  return (
    <>
      <section className="bg-gradient-to-l from-firouzeh-dark via-lajevard to-lajevard-dark text-white">
        <div className="container py-12 text-center md:py-16">
          <h1 className="text-3xl font-bold md:text-4xl">درباره‌ی دیجی مو</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-200">
            دیجی مو یک فروشگاه آنلاین تخصصی موبایل و لوازم جانبی است که با هدف خرید ساده، شفاف و مطمئن ساخته شده.
          </p>
        </div>
      </section>

      <div className="container space-y-12 py-10">
        <section aria-labelledby="stats-title">
          <h2 id="stats-title" className="sr-only">آمار فروشگاه</h2>
          <ul className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <li key={s.label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-lajevard">{formatNumber(s.value)}</p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="values-title">
          <h2 id="values-title" className="mb-4 text-xl font-bold text-lajevard">آنچه برایمان مهم است</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {VALUES.map((v) => (
              <li key={v.title} className="card flex gap-3 p-4">
                <span className="text-3xl" aria-hidden="true">{v.icon}</span>
                <div>
                  <h3 className="font-bold">{v.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">{v.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="mb-4 text-xl font-bold text-lajevard">خرید از دیجی مو چطور است؟</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="card p-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-lajevard text-sm font-bold text-white">{s.n}</span>
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm leading-7 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-2" aria-labelledby="reach-title">
          <div>
            <h2 id="reach-title" className="mb-4 text-xl font-bold text-lajevard">راه‌های ارتباطی</h2>
            <ShopInfo />
          </div>
          <div className="card space-y-3 p-5">
            <h2 className="font-bold text-lajevard">درباره‌ی این پروژه</h2>
            <p className="text-sm leading-8 text-slate-600">
              دیجی مو یک پروژه‌ی نمایشی (نمونه‌کار) با Next.js و Tailwind است. محصولات، قیمت‌ها و اطلاعات تماس واقعی
              نیستند و همه‌ی داده‌ها از فایل‌های JSON و حافظه‌ی مرورگر خوانده می‌شوند.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">مشاهده محصولات</Link>
              <Link href="/contact" className="btn-outline">تماس با ما</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}