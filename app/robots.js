import { SITE_URL } from '@/lib/constants';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/cart', '/checkout', '/order', '/profile', '/login'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}