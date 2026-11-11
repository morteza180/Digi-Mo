'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/hooks/useStore';
import { formatNumber } from '@/lib/format';

export default function ProfileView() {
  const { user, isAdmin, logout, updateName } = useAuth();
  const [orders] = useStore('orders', []);
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => setName(user?.name ?? ''), [user?.name]);

  const myOrders = orders.filter((o) => o.userId === user?.id);

  const onSave = (e) => {
    e.preventDefault();
    setSaved(false);
    try {
      updateName(name);
      setError('');
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // با reload کامل برو: اگه router.push بزنیم، ProtectedRoute همزمان به /login هدایت می‌کنه (race)
  const onLogout = () => {
    logout();
    window.location.assign('/');
  };

  return (
    <div className="grid items-start gap-4 md:grid-cols-3">
      <section className="card space-y-4 p-5 md:col-span-2" aria-labelledby="info-title">
        <h2 id="info-title" className="font-bold text-lajevard">اطلاعات حساب</h2>

        <div>
          <p className="text-xs text-slate-500">ایمیل</p>
          <p dir="ltr" className="text-start text-sm">{user?.email}</p>
        </div>

        <form onSubmit={onSave} noValidate className="space-y-3">
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium">نام و نام خانوادگی</label>
            <input
              id="profile-name"
              className="input"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false); }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'profile-name-err' : undefined}
            />
            {error && <p id="profile-name-err" role="alert" className="mt-1 text-xs text-anar">{error}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={name.trim() === user?.name}>ذخیره تغییرات</button>
            {saved && <span className="text-sm text-firouzeh-dark" role="status">✓ ذخیره شد</span>}
          </div>
        </form>
      </section>

      <aside className="space-y-3">
        <Link href="/profile/orders" className="card block p-4 transition hover:border-firouzeh">
          <p className="text-sm font-bold text-lajevard">📦 سفارش‌های من</p>
          <p className="mt-1 text-sm text-slate-500">{formatNumber(myOrders.length)} سفارش</p>
        </Link>
        <Link href="/wishlist" className="card block p-4 transition hover:border-firouzeh">
          <p className="text-sm font-bold text-lajevard">❤️ ذخیره‌ها</p>
        </Link>
        {isAdmin && (
          <Link href="/admin" className="card block border-zaferan p-4 transition hover:shadow-md">
            <p className="text-sm font-bold text-lajevard">👑 پنل مدیریت</p>
          </Link>
        )}
        <button type="button" onClick={onLogout} className="btn-outline w-full text-anar">خروج از حساب</button>
      </aside>
    </div>
  );
}