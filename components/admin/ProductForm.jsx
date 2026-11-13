'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import {
  createProduct, getProductStates, restoreProduct, updateProduct,
} from '@/services/adminService';
import { toEnglishDigits } from '@/lib/format';
import { useCategories } from '@/hooks/useCatalog';


const PLACEHOLDER = '/images/products/placeholder.svg';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_COLORS = 8;

// ارقام فارسی، جداکننده‌ی هزارگان و اعشار فارسی را هم می‌پذیرد
const num = (v) =>
  Number(toEnglishDigits(String(v ?? '')).replace(/[٬,\s]/g, '').replace(/٫/g, '.'));

function isValidImage(v) {
  const s = String(v).trim();
  if (/^\/(?!\/)\S*$/.test(s)) return true; // مسیر داخلی
  try {
    return new URL(s).protocol === 'https:' && !/\s/.test(s);
  } catch {
    return false;
  }
}

const specsFor = (schema, src = {}) =>
  Object.fromEntries(
    schema.map((s) => [s.key, src[s.key] != null ? String(src[s.key]) : s.type === 'bool' ? '0' : ''])
  );

function buildInitial(p, schema) {
  return {
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    brand: p?.brand ?? '',
    brandName: p?.brandName ?? '',
    category: p?.category ?? '',
    price: p ? String(p.price) : '',
    discount: p ? String(p.discount ?? 0) : '0',
    stock: p ? String(p.stock) : '0',
    image: p?.image ?? PLACEHOLDER,
    shortDescription: p?.shortDescription ?? '',
    warranty: p?.warranty ?? '',
    colors: p?.colors?.length ? p.colors.map((c) => ({ ...c })) : [{ name: '', hex: '#111827' }],
    specs: specsFor(schema, p?.specs),
  };
}

function validate(f, schema, { isEdit, slugs }) {
  const e = {};
  if (f.name.trim().length < 5) e.name = 'نام کالا را کامل بنویس (حداقل ۵ کاراکتر).';

  if (!isEdit) {
    const slug = f.slug.trim();
    if (!SLUG_RE.test(slug)) e.slug = 'فقط حروف کوچک انگلیسی، عدد و خط تیره (مثال: samsung-galaxy-s25-256gb).';
    else if (slugs.includes(slug)) e.slug = 'این نشانی قبلاً استفاده شده است.';
  }

  if (!SLUG_RE.test(f.brand.trim())) e.brand = 'کد برند: حروف کوچک انگلیسی (مثال: samsung).';
  if (f.brandName.trim().length < 2) e.brandName = 'نام فارسی برند را وارد کن.';
  if (!f.category) e.category = 'دسته را انتخاب کن.';

  const price = num(f.price);
  if (!Number.isFinite(price) || price < 1000) e.price = 'قیمت را به تومان وارد کن (حداقل ۱٬۰۰۰).';

  const discount = num(f.discount === '' ? 0 : f.discount);
  if (!Number.isFinite(discount) || discount < 0 || discount > 90) e.discount = 'تخفیف باید بین ۰ تا ۹۰ درصد باشد.';

  const stock = num(f.stock === '' ? 0 : f.stock);
  if (!Number.isFinite(stock) || stock < 0) e.stock = 'موجودی باید عدد و حداقل ۰ باشد.';

  if (!isValidImage(f.image)) e.image = 'آدرس باید با / (مسیر داخلی) یا https:// شروع شود.';
  if (f.shortDescription.trim().length < 10) e.shortDescription = 'توضیح کوتاه را کامل‌تر بنویس (حداقل ۱۰ کاراکتر).';

  schema.forEach((s) => {
    const raw = String(f.specs[s.key] ?? '').trim();
    const n = num(raw);
    if (raw === '' || !Number.isFinite(n) || n < 0) e[`spec-${s.key}`] = 'یک عدد معتبر وارد کن.';
  });
  return e;
}

const toValues = (f, schema) => ({
  name: f.name.trim().replace(/\s+/g, ' '),
  brand: f.brand.trim(),
  brandName: f.brandName.trim(),
  category: f.category,
  price: Math.round(num(f.price)),
  discount: Math.round(num(f.discount === '' ? 0 : f.discount)),
  stock: Math.round(num(f.stock === '' ? 0 : f.stock)),
  image: f.image.trim(),
  shortDescription: f.shortDescription.trim(),
  warranty: f.warranty.trim(),
  colors: f.colors.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), hex: c.hex })),
  specs: Object.fromEntries(schema.map((s) => [s.key, num(f.specs[s.key])])),
});

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

function FormInner({ product, baseProduct, categories, slugs, brands }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [form, setForm] = useState(() =>
    buildInitial(product, categories.find((c) => c.slug === product?.category)?.specSchema ?? [])
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const schema = categories.find((c) => c.slug === form.category)?.specSchema ?? [];

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };
  const setSpec = (key, value) => {
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: value } }));
    setErrors((e) => (e[`spec-${key}`] ? { ...e, [`spec-${key}`]: undefined } : e));
  };
  const setColor = (i, patch) =>
    setForm((f) => ({ ...f, colors: f.colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));

  const bind = (key) => ({
    id: `pf-${key}`,
    value: form[key],
    onChange: (e) => set(key, e.target.value),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `pf-${key}-err` : undefined,
  });

  const onCategory = (slug) => {
    const nextSchema = categories.find((c) => c.slug === slug)?.specSchema ?? [];
    setForm((f) => ({ ...f, category: slug, specs: specsFor(nextSchema, f.specs) }));
    setErrors((e) => ({ ...e, category: undefined }));
  };

  const onBrand = (value) => {
    const known = brands.get(value.trim());
    setForm((f) => ({ ...f, brand: value, brandName: known ?? f.brandName }));
    setErrors((e) => (e.brand ? { ...e, brand: undefined } : e));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const errs = validate(form, schema, { isEdit, slugs });
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`pf-${first}`)?.focus();
      return;
    }

    const values = toValues(form, schema);
    const ok = isEdit
      ? updateProduct(product.id, values, baseProduct)
      : Boolean(createProduct({ ...values, slug: form.slug.trim(), rating: 0, reviewCount: 0 }));

    if (!ok) {
      setFormError('ذخیره ممکن نشد (حافظه‌ی مرورگر پر یا مسدود است).');
      return;
    }
    router.push('/admin/products');
  };

  const imageOk = isValidImage(form.image);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {isEdit && baseProduct && (
        <p className="rounded-xl bg-lajevard-light p-3 text-xs leading-6 text-lajevard-dark">
          این کالا از فایل JSON آمده؛ ویرایش‌ها جداگانه ذخیره می‌شوند و با «بازنشانی» به حالت اولیه برمی‌گردند.
        </p>
      )}

      {/* اطلاعات اصلی */}
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="pf-main">
        <h2 id="pf-main" className="font-bold text-lajevard">اطلاعات اصلی</h2>

        <Field id="pf-name" label="نام کالا" error={errors.name}>
          <input className="input" {...bind('name')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="pf-slug"
            label="نشانی (slug)"
            error={errors.slug}
            hint={isEdit ? 'پس از ایجاد قابل تغییر نیست.' : 'انگلیسی و بدون فاصله؛ در آدرس صفحه‌ی محصول استفاده می‌شود.'}
          >
            <input className="input" dir="ltr" disabled={isEdit} {...bind('slug')} />
          </Field>

          <Field id="pf-category" label="دسته" error={errors.category}>
            <select
              className="input"
              id="pf-category"
              value={form.category}
              onChange={(e) => onCategory(e.target.value)}
              aria-invalid={Boolean(errors.category)}
            >
              <option value="">انتخاب کن...</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>

          <Field id="pf-brand" label="کد برند (انگلیسی)" error={errors.brand} hint="با انتخاب برند موجود، نام فارسی خودکار پر می‌شود.">
            <input
              className="input"
              dir="ltr"
              list="pf-brands"
              id="pf-brand"
              value={form.brand}
              onChange={(e) => onBrand(e.target.value)}
              aria-invalid={Boolean(errors.brand)}
              aria-describedby={errors.brand ? 'pf-brand-err' : undefined}
            />
            <datalist id="pf-brands">
              {[...brands.keys()].map((b) => <option key={b} value={b} />)}
            </datalist>
          </Field>

          <Field id="pf-brandName" label="نام برند (فارسی)" error={errors.brandName}>
            <input className="input" {...bind('brandName')} />
          </Field>
        </div>

        <Field id="pf-shortDescription" label="توضیح کوتاه" error={errors.shortDescription}>
          <textarea className="input min-h-20" rows={3} {...bind('shortDescription')} />
        </Field>

        <Field id="pf-warranty" label="گارانتی (اختیاری)">
          <input className="input" placeholder="مثلاً گارانتی ۱۸ ماهه" {...bind('warranty')} />
        </Field>
      </section>

      {/* قیمت و موجودی */}
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="pf-price-h">
        <h2 id="pf-price-h" className="font-bold text-lajevard">قیمت و موجودی</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="pf-price" label="قیمت (تومان)" error={errors.price}>
            <input className="input" dir="ltr" inputMode="numeric" {...bind('price')} />
          </Field>
          <Field id="pf-discount" label="تخفیف (٪)" error={errors.discount}>
            <input className="input" dir="ltr" inputMode="numeric" {...bind('discount')} />
          </Field>
          <Field id="pf-stock" label="موجودی (عدد)" error={errors.stock}>
            <input className="input" dir="ltr" inputMode="numeric" {...bind('stock')} />
          </Field>
        </div>
      </section>

      {/* تصویر */}
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="pf-img-h">
        <h2 id="pf-img-h" className="font-bold text-lajevard">تصویر</h2>
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {imageOk && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image.trim()} alt="پیش‌نمایش تصویر" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Field
              id="pf-image"
              label="آدرس تصویر"
              error={errors.image}
              hint="مسیر داخلی (مثل /images/products/x.webp) یا لینک https. آپلود فایل ندارد چون ذخیره‌ی عکس در localStorage مناسب نیست."
            >
              <input className="input" dir="ltr" {...bind('image')} />
            </Field>
          </div>
        </div>
      </section>

      {/* رنگ‌ها */}
      <section className="card space-y-3 p-4 sm:p-5" aria-labelledby="pf-color-h">
        <h2 id="pf-color-h" className="font-bold text-lajevard">رنگ‌ها</h2>
        {form.colors.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`انتخاب رنگ ${i + 1}`}
              value={c.hex}
              onChange={(e) => setColor(i, { hex: e.target.value })}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            />
            <input
              className="input"
              aria-label={`نام رنگ ${i + 1}`}
              placeholder="نام رنگ (مثلاً مشکی)"
              value={c.name}
              onChange={(e) => setColor(i, { name: e.target.value })}
            />
            <button
              type="button"
              aria-label="حذف رنگ"
              className="px-2 text-slate-400 hover:text-anar"
              onClick={() => setForm((f) => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }))}
            >
              ✕
            </button>
          </div>
        ))}
        {form.colors.length < MAX_COLORS && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, { name: '', hex: '#111827' }] }))}
          >
            + افزودن رنگ
          </button>
        )}
        <p className="text-xs text-slate-400">ردیف‌هایی که نام ندارند ذخیره نمی‌شوند.</p>
      </section>

      {/* مشخصات فنی */}
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="pf-spec-h">
        <h2 id="pf-spec-h" className="font-bold text-lajevard">مشخصات فنی</h2>
        {schema.length === 0 ? (
          <p className="text-sm text-slate-500">ابتدا دسته را انتخاب کن تا فیلدهای مشخصات فنی همان دسته نمایش داده شود.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {schema.map((s) => {
              const id = `pf-spec-${s.key}`;
              const err = errors[`spec-${s.key}`];
              return (
                <Field key={s.key} id={id} label={`${s.label}${s.unit ? ` (${s.unit})` : ''}`} error={err}>
                  {s.type === 'bool' ? (
                    <select className="input" id={id} value={form.specs[s.key]} onChange={(e) => setSpec(s.key, e.target.value)}>
                      <option value="0">خیر</option>
                      <option value="1">بله</option>
                    </select>
                  ) : (
                    <input
                      className="input"
                      id={id}
                      dir="ltr"
                      inputMode="decimal"
                      value={form.specs[s.key]}
                      onChange={(e) => setSpec(s.key, e.target.value)}
                      aria-invalid={Boolean(err)}
                      aria-describedby={err ? `${id}-err` : undefined}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        )}
      </section>

      {formError && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{formError}</p>
      )}
      {Object.values(errors).some(Boolean) && (
        <p className="text-sm text-anar" role="alert">لطفاً فیلدهای علامت‌دار را اصلاح کن.</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">{isEdit ? 'ذخیره تغییرات' : 'افزودن محصول'}</button>
        <Link href="/admin/products" className="btn-outline">انصراف</Link>
      </div>
    </form>
  );
}

export default function ProductForm({ products, productId = null }) {
  const categories = useCategories();  const [overlay, , ready] = useStore('products', {});
  const states = useMemo(() => getProductStates(products, overlay), [products, overlay]);

  const slugs = useMemo(() => states.map((p) => p.slug), [states]);
  const brands = useMemo(() => new Map(states.map((p) => [p.brand, p.brandName])), [states]);

  if (!ready) return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;

  if (!productId) {
    return <FormInner key="new" product={null} baseProduct={null} categories={categories} slugs={slugs} brands={brands} />;
  }

  const current = states.find((p) => p.id === productId);

  if (!current) {
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl" aria-hidden="true">📭</p>
        <h2 className="mt-3 font-bold">این محصول پیدا نشد</h2>
        <Link href="/admin/products" className="btn-primary mt-5">بازگشت به لیست</Link>
      </div>
    );
  }

  if (current._state === 'deleted') {
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl" aria-hidden="true">🗑️</p>
        <h2 className="mt-3 font-bold">این محصول حذف شده است</h2>
        <p className="mt-1 text-sm text-slate-500">برای ویرایش، ابتدا آن را بازگردانی کن.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => restoreProduct(current.id)}>بازگردانی</button>
          <Link href="/admin/products" className="btn-outline">بازگشت</Link>
        </div>
      </div>
    );
  }

  return (
    <FormInner
      key={productId}
      product={current}
      baseProduct={products.find((p) => p.id === productId) ?? null}
      categories={categories}
      slugs={slugs}
      brands={brands}
    />
  );
}