import ProductForm from '@/components/admin/ProductForm';
import { getProducts, getCategories } from '@/services/products.server';

export const metadata = { title: 'افزودن محصول' };

export default async function NewProductPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">افزودن محصول</h1>
      <ProductForm products={products} categories={categories} />
    </>
  );
}