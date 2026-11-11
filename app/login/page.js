import AuthForm from '@/components/AuthForm';

export const metadata = {
  title: 'ورود | ثبت‌نام',
  robots: { index: false, follow: false },
};

function safeNext(value) {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== 'string') return '/profile';
  const internal = v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\');
  return internal && !v.startsWith('/login') ? v : '/profile';
}

export default function LoginPage({ searchParams }) {
  return (
    <div className="container py-10">
      <AuthForm next={safeNext(searchParams?.next)} />
    </div>
  );
}