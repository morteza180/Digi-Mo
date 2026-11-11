'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, pathname, router]);

  if (!ready || !user) {
    return (
      <div className="container py-10" aria-busy="true">
        <div className="card mx-auto h-64 max-w-3xl animate-pulse bg-slate-100" />
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div className="container py-16 text-center">
        <p className="text-5xl" aria-hidden="true">🚫</p>
        <h1 className="mt-3 text-xl font-bold">به این صفحه دسترسی نداری</h1>
        <Link href="/" className="btn-primary mt-6">بازگشت به خانه</Link>
      </div>
    );
  }

  return children;
}