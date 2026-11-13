'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { deleteMessage, setMessageStatus, SUBJECTS } from '@/services/messageService';
import { downloadJSON } from '@/services/dataService';
import { formatDateTime, formatNumber, normalizeFa } from '@/lib/format';

const SUBJECT_LABEL = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.label]));

export default function AdminMessagesView() {
  const [messages, , ready] = useStore('messages', []);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const unread = messages.filter((m) => m.status === 'new').length;

  const list = useMemo(() => {
    const q = normalizeFa(query);
    return messages
      .filter((m) => tab === 'all' || m.status === tab)
      .filter((m) => !q || normalizeFa(`${m.code} ${m.name} ${m.email} ${m.mobile} ${m.text}`).includes(q));
  }, [messages, tab, query]);

  const onDelete = (m) => {
    if (window.confirm(`پیام ${m.code} حذف شود؟`)) deleteMessage(m.id);
  };

  if (!ready) return <div className="card h-80 animate-pulse bg-slate-100" aria-busy="true" />;

  const tabClass = (active) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
      active ? 'border-lajevard bg-lajevard text-white' : 'border-slate-300 bg-white hover:border-lajevard'
    }`;
  const tabs = [
    ['all', `همه (${formatNumber(messages.length)})`],
    ['new', `جدید (${formatNumber(unread)})`],
    ['read', `خوانده‌شده (${formatNumber(messages.length - unread)})`],
  ];

  if (messages.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-5xl" aria-hidden="true">📭</p>
        <h2 className="mt-3 font-bold">هنوز پیامی دریافت نشده</h2>
        <p className="mt-1 text-sm text-slate-500">
          پیام‌ها فقط در همین مرورگر ذخیره می‌شوند؛ از صفحه‌ی «تماس با ما» یک پیام آزمایشی بفرست.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="وضعیت پیام">
          {tabs.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tabClass(tab === key)} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-outline" onClick={() => downloadJSON('messages.json', messages)}>
          ⬇️ خروجی JSON
        </button>
      </div>

      <input
        className="input sm:max-w-sm"
        placeholder="جستجوی نام، کد، ایمیل یا متن..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="جستجو"
      />

      {list.length === 0 && <div className="card p-10 text-center text-slate-500">پیامی با این فیلتر پیدا نشد.</div>}

      <ul className="space-y-3">
        {list.map((m) => {
          const isNew = m.status === 'new';
          return (
            <li key={m.id}>
              <details className={`card group ${isNew ? 'border-firouzeh/60' : ''}`}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-4">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isNew ? 'bg-firouzeh' : 'bg-slate-300'}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${isNew ? 'font-bold' : 'font-medium'}`}>
                      {m.name} · {SUBJECT_LABEL[m.subject] ?? m.subject}
                    </span>
                    <span className="block truncate text-xs text-slate-400">{m.text}</span>
                  </span>
                  {isNew && <span className="rounded-full bg-firouzeh/15 px-2 py-0.5 text-xs font-medium text-firouzeh-dark">جدید</span>}
                  <span className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(m.createdAt)}</span>
                </summary>

                <div className="space-y-4 border-t border-slate-100 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-8">{m.text}</p>

                  <dl className="grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-slate-500">کد مرجع</dt>
                      <dd dir="ltr" className="text-start font-medium">{m.code}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">ایمیل</dt>
                      <dd dir="ltr" className="break-all text-start">{m.email || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">موبایل</dt>
                      <dd dir="ltr" className="text-start">{m.mobile || '—'}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {m.email && (
                      <a
                        className="btn-primary px-3 py-1.5 text-xs"
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`پاسخ به پیام شما در دیجی مو (${m.code})`)}`}
                      >
                        پاسخ با ایمیل
                      </a>
                    )}
                    {m.mobile && (
                      <a className="btn-outline px-3 py-1.5 text-xs" href={`tel:${m.mobile}`}>تماس تلفنی</a>
                    )}
                    <button
                      type="button"
                      className="btn-outline px-3 py-1.5 text-xs"
                      onClick={() => setMessageStatus(m.id, isNew ? 'read' : 'new')}
                    >
                      {isNew ? 'علامت‌گذاری «خوانده‌شده»' : 'علامت‌گذاری «جدید»'}
                    </button>
                    <button type="button" className="px-3 py-1.5 text-xs text-anar hover:underline" onClick={() => onDelete(m)}>
                      حذف
                    </button>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}