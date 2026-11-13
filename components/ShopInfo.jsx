'use client';

import { useSettings } from '@/hooks/useCatalog';
import { toEnglishDigits } from '@/lib/format';

export default function ShopInfo() {
  const { shop } = useSettings();

  const items = [
    {
      icon: '📞', label: 'تلفن', value: shop.phone, ltr: true,
      href: `tel:${toEnglishDigits(shop.phone).replace(/[^\d+]/g, '')}`,
    },
    { icon: '✉️', label: 'ایمیل', value: shop.email, ltr: true, href: `mailto:${shop.email}` },
    { icon: '📍', label: 'نشانی', value: shop.address },
    { icon: '🕘', label: 'ساعت کاری', value: shop.workingHours },
    shop.instagram && {
      icon: '📷', label: 'اینستاگرام', value: `@${shop.instagram}`, ltr: true,
      href: `https://instagram.com/${encodeURIComponent(shop.instagram)}`, external: true,
    },
  ].filter(Boolean);

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label} className="card flex items-start gap-3 p-4">
          <span className="text-2xl" aria-hidden="true">{it.icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{it.label}</p>
            {it.href ? (
              <a
                href={it.href}
                dir={it.ltr ? 'ltr' : undefined}
                {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="block break-words text-start text-sm font-medium text-lajevard hover:underline"
              >
                {it.value}
              </a>
            ) : (
              <p className="text-sm font-medium">{it.value}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}