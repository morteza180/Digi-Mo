'use client';

import Link from 'next/link';
import { useCompare } from '@/hooks/useLists';
import { formatNumber } from '@/lib/format';
import { MAX_COMPARE } from '@/lib/constants';

export default function CompareBar() {
  const { ids, clear } = useCompare();
  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,.08)] backdrop-blur print:hidden">
      <div className="container flex items-center justify-between gap-3 py-3">
        <p className="text-sm">
          <strong>{formatNumber(ids.length)}</strong> از {formatNumber(MAX_COMPARE)} کالا برای مقایسه انتخاب شده
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={clear} className="btn-outline">پاک کردن</button>
          <Link href="/compare" className={`btn-primary ${ids.length < 2 ? 'pointer-events-none opacity-50' : ''}`}>
            مقایسه
          </Link>
        </div>
      </div>
    </div>
  );
}