import CategoryForm from '@/components/admin/CategoryForm';

export const metadata = { title: 'ویرایش دسته' };

export default function EditCategoryPage({ params }) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">ویرایش دسته</h1>
      <CategoryForm categoryId={decodeURIComponent(params.id)} />
    </>
  );
}