'use client';

import { useEffect, useState } from 'react';
import ShopInfo from '@/components/ShopInfo';
import { useStore } from '@/hooks/useStore';
import { SUBJECTS, createMessage } from '@/services/messageService';
import { validateEmail } from '@/services/authService';
import { formatNumber, isValidIranMobile } from '@/lib/format';

const EMPTY = { name: '', email: '', mobile: '', subject: '', text: '', website: '' };
const MAX_TEXT = 1000;

function validate(f) {
  const e = {};
  if (f.name.trim().length < 3) e.name = 'نام را کامل وارد کن (حداقل ۳ کاراکتر).';

  const email = f.email.trim();
  const mobile = f.mobile.trim();
  if (!email && !mobile) {
    e.email = 'برای پاسخ‌گویی، حداقل یکی از ایمیل یا موبایل را وارد کن.';
  } else {
    if (email && !validateEmail(email)) e.email = 'ایمیل معتبر نیست.';
    if (mobile && !isValidIranMobile(mobile)) e.mobile = 'شماره موبایل معتبر نیست (مثال: 09123456789).';
  }

  if (!f.subject) e.subject = 'موضوع پیام را انتخاب کن.';

  const len = f.text.trim().length;
  if (len < 10) e.text = 'پیام را کامل‌تر بنویس (حداقل ۱۰ کاراکتر).';
  else if (len > MAX_TEXT) e.text = `پیام حداکثر ${formatNumber(MAX_TEXT)} کاراکتر باشد.`;
  return e;
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-anar">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export default function ContactView() {
  const [session] = useStore('session', null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sentCode, setSentCode] = useState(null);

  // پر کردن نام و ایمیل از کاربر واردشده (فقط اگر کاربر هنوز چیزی ننوشته)
  useEffect(() => {
    if (!session) return;
    setForm((f) => ({ ...f, name: f.name || session.name, email: f.email || session.email }));
  }, [session]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] || (key === 'mobile' && e.email) ? { ...e, [key]: undefined, ...(key === 'mobile' ? { email: undefined } : {}) } : e));
  };

  const bind = (key) => ({
    id: `ct-${key}`,
    value: form[key],
    onChange: (e) => set(key, e.target.value),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `ct-${key}-err` : undefined,
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // honeypot: ربات‌ها فیلد مخفی را پر می‌کنند؛ ظاهراً موفق نشان بده ولی چیزی ذخیره نکن
    if (form.website) {
      setSentCode('MSG-000000');
      return;
    }

    const errs = validate(form);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`ct-${first}`)?.focus();
      return;
    }

    try {
      const msg = createMessage({ ...form, userId: session?.id ?? null });
      setSentCode(msg.code);
      setForm((f) => ({ ...EMPTY, name: f.name, email: f.email }));
    } catch (err) {
      setFormError(err.message || 'ارسال پیام با خطا مواجه شد.');
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {sentCode ? (
          <div className="card p-8 text-center" role="status" aria-live="polite">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-firouzeh text-3xl text-white">✓</div>
            <h2 className="mt-4 text-xl font-bold text-lajevard">پیام شما ثبت شد</h2>
            <p className="mt-2 text-sm text-slate-500">کد مرجع پیام شما:</p>
            <p dir="ltr" className="mt-1 text-lg font-bold tracking-wider">{sentCode}</p>
            <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-slate-400">
              این یک پروژه‌ی نمایشی است؛ پیام فقط در حافظه‌ی همین مرورگر ذخیره شده و برای کسی ایمیل نمی‌شود.
            </p>
            <button type="button" className="btn-primary mt-6" onClick={() => setSentCode(null)}>
              ارسال پیام جدید
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="card space-y-4 p-4 sm:p-5">
            <h2 className="font-bold text-lajevard">ارسال پیام</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ct-name" label="نام و نام خانوادگی" error={errors.name}>
                <input className="input" autoComplete="name" {...bind('name')} />
              </Field>
              <Field id="ct-subject" label="موضوع" error={errors.subject}>
                <select className="input" {...bind('subject')}>
                  <option value="">انتخاب کن...</option>
                  {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field id="ct-email" label="ایمیل" error={errors.email}>
                <input className="input" dir="ltr" type="email" autoComplete="email" {...bind('email')} />
              </Field>
              <Field id="ct-mobile" label="موبایل" error={errors.mobile} hint="حداقل یکی از ایمیل یا موبایل لازم است.">
                <input className="input" dir="ltr" inputMode="numeric" autoComplete="tel" placeholder="09123456789" {...bind('mobile')} />
              </Field>
            </div>

            <Field id="ct-text" label="متن پیام" error={errors.text}>
              <textarea className="input min-h-36" rows={6} maxLength={MAX_TEXT} {...bind('text')} />
            </Field>
            <p className="-mt-2 text-end text-xs text-slate-400" aria-live="polite">
              {formatNumber(form.text.length)} / {formatNumber(MAX_TEXT)}
            </p>

            {/* honeypot: برای کاربر نامرئی و غیرقابل فوکوس */}
            <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="ct-website">وب‌سایت</label>
              <input
                id="ct-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
            </div>

            {formError && <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{formError}</p>}
            {Object.values(errors).some(Boolean) && (
              <p className="text-sm text-anar" role="alert">لطفاً فیلدهای علامت‌دار را اصلاح کن.</p>
            )}

            <button type="submit" className="btn-primary">ارسال پیام</button>
          </form>
        )}
      </div>

      <aside aria-label="اطلاعات تماس">
        <ShopInfo />
      </aside>
    </div>
  );
}