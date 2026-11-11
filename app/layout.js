import localFont from 'next/font/local';
import './globals.css';
import Providers from '@/components/ui/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CompareBar from '@/components/CompareBar';
import { getCategories, getSettings } from '@/services/products.server';

const vazir = localFont({
  src: [
    { path: './fonts/Vazirmatn-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Vazirmatn-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Vazirmatn-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-vazir',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://digimo.example'),
  title: {
    default: 'دیجی مو | فروشگاه موبایل و لوازم جانبی',
    template: '%s | دیجی مو',
  },
  description: 'خرید آنلاین موبایل و لوازم جانبی اصل با ضمانت اصالت و ارسال سریع',
  openGraph: { locale: 'fa_IR', type: 'website', siteName: 'دیجی مو' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f3a6e',
};

export default async function RootLayout({ children }) {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="font-sans">
        <Providers categories={categories} settings={settings}>
          <Navbar />
          <main className="min-h-[70vh] pb-4">{children}</main>
          <Footer />
          <CompareBar />
        </Providers>
      </body>
    </html>
  );
}