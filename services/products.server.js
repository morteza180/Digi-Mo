import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';

const readJSON = cache(async (name) => {
  const file = path.join(process.cwd(), 'public/data', `${name}.json`);
  return JSON.parse(await fs.readFile(file, 'utf-8'));
});

export const getProducts = () => readJSON('products');
export const getSettings = () => readJSON('settings');

export const getCategories = async () =>
  [...(await readJSON('categories'))].sort((a, b) => a.order - b.order);

export const getProductBySlug = async (slug) =>
  (await getProducts()).find((p) => p.slug === slug);