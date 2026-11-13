import CategoryForm from '@/components/admin/CategoryForm';

export const metadata = { title: 'افزودن دسته' };

export default function NewCategoryPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-lajevard">افزودن دسته</h1>
      <CategoryForm />
    </>
  );
}