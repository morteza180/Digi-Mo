'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_ADMIN, validateEmail, validatePassword } from '@/services/authService';

const EMPTY = { name: '', email: '', password: '', confirm: '' };

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-anar">{error}</p>}
    </div>
  );
}

function validate(mode, f) {
  const e = {};
  if (mode === 'register' && f.name.trim().length < 3) e.name = 'نام را کامل وارد کن (حداقل ۳ کاراکتر).';
  if (!validateEmail(f.email)) e.email = 'ایمیل معتبر نیست.';
  if (mode === 'register') {
    if (!validatePassword(f.password)) e.password = 'حداقل ۸ کاراکتر و شامل حرف و عدد باشد.';
    else if (f.password !== f.confirm) e.confirm = 'تکرار رمز عبور یکسان نیست.';
  } else if (!f.password) {
    e.password = 'رمز عبور را وارد کن.';
  }
  return e;
}

export default function AuthForm({ next = '/profile' }) {
  const router = useRouter();
  const { user, ready, login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // کاربر واردشده (چه همین الان، چه قبلاً) به مقصد برگردانده میشه
  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setForm(EMPTY);
  };

  const bind = (key) => ({
    id: `auth-${key}`,
    value: form[key],
    onChange: (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((er) => (er[key] || er.form ? { ...er, [key]: undefined, form: undefined } : er));
    },
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `auth-${key}-err` : undefined,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const errs = validate(mode, form);
    setErrors(errs);
    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      document.getElementById(`auth-${firstKey}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register({ name: form.name, email: form.email, password: form.password });
      // انتقال توسط useEffect بالا انجام میشه
    } catch (err) {
      setErrors({ [err.field ?? 'form']: err.message || 'خطای ناشناخته' });
      setSubmitting(false);
    }
  };

  if (!ready || user) {
    return (
      <div className="card mx-auto h-72 max-w-md animate-pulse bg-slate-100" aria-busy="true" />
    );
  }

  const tab = (active) =>
    `flex-1 rounded-lg py-2 text-sm font-medium transition ${
      active ? 'bg-white text-lajevard shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card p-5 sm:p-6">
        <h1 className="mb-4 text-center text-xl font-bold text-lajevard">
          {mode === 'login' ? 'ورود به حساب کاربری' : 'ساخت حساب کاربری'}
        </h1>

        <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="ورود یا ثبت‌نام">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={tab(mode === 'login')} onClick={() => switchMode('login')}>
            ورود
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={tab(mode === 'register')} onClick={() => switchMode('register')}>
            ثبت‌نام
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {mode === 'register' && (
            <Field id="auth-name" label="نام و نام خانوادگی" error={errors.name}>
              <input className="input" autoComplete="name" {...bind('name')} />
            </Field>
          )}

          <Field id="auth-email" label="ایمیل" error={errors.email}>
            <input className="input" dir="ltr" type="email" autoComplete="email" placeholder="you@example.com" {...bind('email')} />
          </Field>

          <Field id="auth-password" label="رمز عبور" error={errors.password}>
            <div className="relative">
              <input
                className="input pe-16"
                dir="ltr"
                type={showPass ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                {...bind('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-lajevard"
                aria-label={showPass ? 'پنهان کردن رمز' : 'نمایش رمز'}
              >
                {showPass ? 'پنهان' : 'نمایش'}
              </button>
            </div>
          </Field>

          {mode === 'register' && (
            <Field id="auth-confirm" label="تکرار رمز عبور" error={errors.confirm}>
              <input
                className="input"
                dir="ltr"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                {...bind('confirm')}
              />
            </Field>
          )}

          {errors.form && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{errors.form}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'لطفاً صبر کن...' : mode === 'login' ? 'ورود' : 'ثبت‌نام'}
          </button>
        </form>
      </div>

      <div className="card space-y-2 border-dashed p-4 text-sm text-slate-600">
        <p className="font-medium text-lajevard">🧪 حساب ادمین نمونه (برای مشاهده‌ی پنل مدیریت)</p>
        <p dir="ltr" className="text-start text-xs">
          {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
        </p>
        <button
          type="button"
          className="btn-outline px-3 py-1.5"
          onClick={() => {
            setMode('login');
            setErrors({});
            setForm({ ...EMPTY, email: DEMO_ADMIN.email, password: DEMO_ADMIN.password });
          }}
        >
          پر کردن خودکار
        </button>
      </div>
    </div>
  );
}