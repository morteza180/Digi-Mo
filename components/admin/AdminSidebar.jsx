'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/hooks/useStore';
import { formatNumber } from '@/lib/format';

const LINKS = [
  { href: '/admin', label: 'داشبورد', icon: '📊', exact: true },
  { href: '/admin/products', label: 'محصولات', icon: '📦' },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: '🗂️' },
  { href: '/admin/orders', label: 'سفارش‌ها', icon: '🧾' },
  { href: '/admin/messages', label: 'پیام‌ها', icon: '✉️', badge: true },
  { href: '/admin/users', label: 'کاربران', icon: '👥' },
  { href: '/admin/settings', label: 'تنظیمات', icon: '⚙️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [messages] = useStore('messages', []);
  const unread = messages.filter((m) => m.status === 'new').length;
  const isActive = (l) => (l.exact ? pathname === l.href : pathname.startsWith(l.href));

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="card p-3">
        <p className="mb-3 hidden truncate px-2 text-xs text-slate-500 lg:block">👑 {user?.name}</p>

        <nav aria-label="منوی مدیریت" className="flex gap-1 overflow-x-auto lg:flex-col">
          {LINKS.map((l) => {
            const active = isActive(l);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
                  active ? 'bg-lajevard text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span aria-hidden="true">{l.icon}</span>
                {l.label}
                {l.badge && unread > 0 && (
                  <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-anar px-1 text-[11px] font-bold text-white">
                    {formatNumber(unread)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Link href="/" className="mt-3 hidden px-2 text-xs text-firouzeh-dark hover:underline lg:block">
          ← بازگشت به فروشگاه
        </Link>
      </div>
    </aside>
  );
}