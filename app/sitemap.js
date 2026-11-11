import { getProducts } from '@/services/products.server';
import { SITE_URL } from '@/lib/constants';

export default async function sitemap() {
  const products = await getProducts();
  const now = new Date();

  const pages = ['', '/products', '/about', '/contact'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    priority: path === '' ? 1 : 0.8,
  }));

  const items = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...pages, ...items];
}