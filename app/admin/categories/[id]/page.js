import CategoryForm from '@/components/admin/CategoryForm';
// import { getProducts } from '@/services/products.server';
import categoryJson from "@/public/data/categories.json"
import { readFileSync } from "fs"
import path from "path"
import { json } from 'stream/consumers';

export const metadata = { title: 'ویرایش دسته' };

// export async function generateStaticParams() {
//   const filePath = path.join(process.cwd(), "public", "data", "categories.json")
//   const categories = JSON.parse(readFileSync(filePath, 'utf-8'))

//   return categories.map((category) => ({
//     id: String(category.id)
//   })
//   )
// }

export default function EditCategoryPage({ params }) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">ویرایش دسته</h1>
      <CategoryForm categoryId={decodeURIComponent(params.id)} />
    </>
  );
}