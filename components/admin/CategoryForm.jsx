'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useBaseData } from '@/hooks/useCatalog';
import {
  createCategory, getCategoryStates, restoreCategory, updateCategory,
} from '@/services/categoryService';
import { parseNumber } from '@/lib/format';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KEY_RE = /^[a-zA-Z][a-zA-Z0-9]*$/;
const MAX_SPECS = 12;

const rid = () => Math.random().toString(36).slice(2, 9);
const newRow = () => ({ rid: rid(), key: '', label: '', unit: '', type: 'number', better: 'higher', _new: true });
const fromSchema = (schema = []) =>
  schema.map((s) => ({
    rid: rid(), key: s.key, label: s.label, unit: s.unit ?? '',
    type: s.type ?? 'number', better: s.better ?? 'none', _new: false,
  }));

const toSchema = (rows) =>
  rows.map((r) => {
    const item = {
      key: r.key.trim(),
      label: r.label.trim(),
      unit: r.unit.trim(),
      better: r.better === 'none' ? null : r.better,
    };
    if (r.type === 'bool') item.type = 'bool';
    return item;
  });

function validate(f, { isEdit, slugs }) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'نام دسته را وارد کن.';

  if (!isEdit) {
    const slug = f.slug.trim();
    if (!SLUG_RE.test(slug)) e.slug = 'فقط حروف کوچک انگلیسی، عدد و خط تیره (مثال: smart-watch).';
    else if (slugs.includes(slug)) e.slug = 'این slug قبلاً استفاده شده است.';
  }

  if (f.icon.trim().length < 1) e.icon = 'یک ایموجی یا نماد وارد کن.';

  const order = parseNumber(f.order);
  if (!Number.isInteger(order) || order < 0 || order > 999) e.order = 'ترتیب باید عدد صحیح بین ۰ تا ۹۹۹ باشد.';

  const keys = new Set();
  f.specs.forEach((r, i) => {
    const k = r.key.trim();
    if (!KEY_RE.test(k)) e[`spec-${i}-key`] = 'کلید انگلیسی (مثال: ram یا batteryHours).';
    else if (keys.has(k)) e[`spec-${i}-key`] = 'کلید تکراری است.';
    keys.add(k);
    if (r.label.trim().length < 2) e[`spec-${i}-label`] = 'عنوان را وارد کن.';
  });
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

function FormInner({ category, baseCategory, slugs, nextOrder }) {
  const router = useRouter();
  const isEdit = Boolean(category);

  const [form, setForm] = useState(() => ({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    icon: category?.icon ?? '',
    order: String(category?.order ?? nextOrder),
    description: category?.description ?? '',
    specs: category ? fromSchema(category.specSchema) : [newRow()],
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const clear = (prefix) =>
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k, v]) => v && !k.startsWith(prefix))));

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    clear(key);
  };
  const setRow = (i, patch) => {
    setForm((f) => ({ ...f, specs: f.specs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
    clear(`spec-${i}-`);
  };
  const move = (i, dir) =>
    setForm((f) => {
      const j = i + dir;
      if (j < 0 || j >= f.specs.length) return f;
      const specs = [...f.specs];
      [specs[i], specs[j]] = [specs[j], specs[i]];
      return { ...f, specs };
    });
  const removeRow = (i) => {
    setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith('spec-'))));
  };

  const bind = (key) => ({
    id: `cf-${key}`,
    value: form[key],
    onChange: (e) => set(key, e.target.value),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `cf-${key}-err` : undefined,
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const errs = validate(form, { isEdit, slugs });
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }

    const values = {
      name: form.name.trim(),
      icon: form.icon.trim(),
      order: parseNumber(form.order),
      description: form.description.trim(),
      specSchema: toSchema(form.specs),
    };
    const ok = isEdit
      ? updateCategory(category.id, values, baseCategory)
      : Boolean(createCategory({ ...values, slug: form.slug.trim() }));

    if (!ok) {
      setFormError('ذخیره ممکن نشد (حافظه‌ی مرورگر پر یا مسدود است).');
      return;
    }
    router.push('/admin/categories');
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="cf-main">
        <h2 id="cf-main" className="font-bold text-lajevard">اطلاعات دسته</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cf-name" label="نام دسته" error={errors.name}>
            <input className="input" {...bind('name')} />
          </Field>
          <Field
            id="cf-slug"
            label="نشانی (slug)"
            error={errors.slug}
            hint={isEdit ? 'چون محصولات به آن وصلند، قابل تغییر نیست.' : 'انگلیسی و بدون فاصله.'}
          >
            <input className="input" dir="ltr" disabled={isEdit} {...bind('slug')} />
          </Field>
          <Field id="cf-icon" label="آیکون (ایموجی)" error={errors.icon}>
            <input className="input" maxLength={8} {...bind('icon')} />
          </Field>
          <Field id="cf-order" label="ترتیب نمایش" error={errors.order} hint="عدد کوچک‌تر، زودتر نمایش داده می‌شود.">
            <input className="input" dir="ltr" inputMode="numeric" {...bind('order')} />
          </Field>
        </div>

        <Field id="cf-description" label="توضیح کوتاه (اختیاری)">
          <input className="input" {...bind('description')} />
        </Field>
      </section>

      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="cf-specs">
        <div>
          <h2 id="cf-specs" className="font-bold text-lajevard">مشخصات فنی این دسته</h2>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            این لیست هم فیلدهای فرم محصول و هم ردیف‌های جدول مقایسه را می‌سازد. «بهترین مقدار» مشخص می‌کند در مقایسه،
            مقدار بزرگ‌تر سبز شود، کوچک‌تر یا هیچ‌کدام. کلید مشخصه‌های موجود قابل تغییر نیست تا داده‌ی محصولات گم نشود.
          </p>
        </div>

        {form.specs.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">هنوز مشخصه‌ای تعریف نشده است.</p>
        )}

        {form.specs.map((r, i) => (
          <div key={r.rid} className="space-y-3 rounded-xl border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field id={`cf-spec-${i}-key`} label="کلید (انگلیسی)" error={errors[`spec-${i}-key`]}>
                <input
                  id={`cf-spec-${i}-key`}
                  className="input"
                  dir="ltr"
                  disabled={!r._new}
                  value={r.key}
                  onChange={(e) => setRow(i, { key: e.target.value })}
                  aria-invalid={Boolean(errors[`spec-${i}-key`])}
                  aria-describedby={errors[`spec-${i}-key`] ? `cf-spec-${i}-key-err` : undefined}
                />
              </Field>
              <Field id={`cf-spec-${i}-label`} label="عنوان نمایشی" error={errors[`spec-${i}-label`]}>
                <input
                  id={`cf-spec-${i}-label`}
                  className="input"
                  value={r.label}
                  onChange={(e) => setRow(i, { label: e.target.value })}
                  aria-invalid={Boolean(errors[`spec-${i}-label`])}
                  aria-describedby={errors[`spec-${i}-label`] ? `cf-spec-${i}-label-err` : undefined}
                />
              </Field>
              <Field id={`cf-spec-${i}-unit`} label="واحد (اختیاری)">
                <input
                  id={`cf-spec-${i}-unit`}
                  className="input"
                  value={r.unit}
                  onChange={(e) => setRow(i, { unit: e.target.value })}
                />
              </Field>
              <Field id={`cf-spec-${i}-type`} label="نوع مقدار">
                <select
                  id={`cf-spec-${i}-type`}
                  className="input"
                  value={r.type}
                  onChange={(e) => setRow(i, { type: e.target.value })}
                >
                  <option value="number">عدد</option>
                  <option value="bool">بله / خیر</option>
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                بهترین مقدار:
                <select
                  className="input w-auto py-1.5"
                  value={r.better}
                  onChange={(e) => setRow(i, { better: e.target.value })}
                >
                  <option value="higher">بزرگ‌تر</option>
                  <option value="lower">کوچک‌تر</option>
                  <option value="none">بدون هایلایت</option>
                </select>
              </label>
              <div className="flex items-center gap-1">
                <button type="button" className="btn-outline px-3 py-1.5" onClick={() => move(i, -1)} disabled={i === 0} aria-label="انتقال به بالا">↑</button>
                <button type="button" className="btn-outline px-3 py-1.5" onClick={() => move(i, 1)} disabled={i === form.specs.length - 1} aria-label="انتقال به پایین">↓</button>
                <button type="button" className="btn-outline px-3 py-1.5 text-anar" onClick={() => removeRow(i)}>حذف</button>
              </div>
            </div>
          </div>
        ))}

        {form.specs.length < MAX_SPECS && (
          <button type="button" className="btn-outline" onClick={() => setForm((f) => ({ ...f, specs: [...f.specs, newRow()] }))}>
            + افزودن مشخصه
          </button>
        )}
      </section>

      {formError && <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{formError}</p>}
      {Object.values(errors).some(Boolean) && (
        <p className="text-sm text-anar" role="alert">لطفاً فیلدهای علامت‌دار را اصلاح کن.</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">{isEdit ? 'ذخیره تغییرات' : 'افزودن دسته'}</button>
        <Link href="/admin/categories" className="btn-outline">انصراف</Link>
      </div>
    </form>
  );
}

export default function CategoryForm({ categoryId = null }) {
  const { categories: baseCategories } = useBaseData();
  const [overlay, , ready] = useStore('categories', {});

  const states = useMemo(() => getCategoryStates(baseCategories, overlay), [baseCategories, overlay]);
  const slugs = useMemo(() => states.map((c) => c.slug), [states]);
  const nextOrder = useMemo(() => Math.max(0, ...states.map((c) => c.order ?? 0)) + 1, [states]);

  if (!ready) return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;

  if (!categoryId) {
    return <FormInner key="new" category={null} baseCategory={null} slugs={slugs} nextOrder={nextOrder} />;
  }

  const current = states.find((c) => c.id === categoryId);

  if (!current) {
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl" aria-hidden="true">📭</p>
        <h2 className="mt-3 font-bold">این دسته پیدا نشد</h2>
        <Link href="/admin/categories" className="btn-primary mt-5">بازگشت به لیست</Link>
      </div>
    );
  }

  if (current._state === 'deleted') {
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl" aria-hidden="true">🗑️</p>
        <h2 className="mt-3 font-bold">این دسته حذف شده است</h2>
        <p className="mt-1 text-sm text-slate-500">برای ویرایش، ابتدا آن را بازگردانی کن.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => restoreCategory(current.id)}>بازگردانی</button>
          <Link href="/admin/categories" className="btn-outline">بازگشت</Link>
        </div>
      </div>
    );
  }

  return (
    <FormInner
      key={categoryId}
      category={current}
      baseCategory={baseCategories.find((c) => c.id === categoryId) ?? null}
      slugs={slugs}
      nextOrder={nextOrder}
    />
  );
}