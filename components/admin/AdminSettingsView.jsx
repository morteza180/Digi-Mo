'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useBaseData, useSettings } from '@/hooks/useCatalog';
import { getProductStates, resetAllProducts } from '@/services/adminService';
import { getCategoryStates, resetAllCategories } from '@/services/categoryService';
import { downloadJSON } from '@/services/dataService';
import { hasSettingsOverlay, resetSettings, saveSettings } from '@/services/settingsService';
import { parseNumber } from '@/lib/format';

const WEEK = [
  { day: 6, label: 'شنبه' }, { day: 0, label: 'یکشنبه' }, { day: 1, label: 'دوشنبه' },
  { day: 2, label: 'سه‌شنبه' }, { day: 3, label: 'چهارشنبه' }, { day: 4, label: 'پنجشنبه' },
  { day: 5, label: 'جمعه' },
];
const SHOP_FIELDS = [
  ['name', 'نام فروشگاه'], ['slogan', 'شعار'], ['phone', 'شماره تماس'], ['email', 'ایمیل'],
  ['address', 'نشانی'], ['workingHours', 'ساعت کاری'], ['instagram', 'آیدی اینستاگرام (اختیاری)'],
];
const LTR_FIELDS = ['phone', 'email', 'instagram'];
const ID_RE = /^[a-z][a-z0-9-]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_METHODS = 6;
const MAX_SLOTS = 6;

const rid = () => Math.random().toString(36).slice(2, 9);
const parseCities = (text) => [...new Set(text.split('\n').map((c) => c.trim()).filter(Boolean))];
const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const strip = ({ _state, ...rest }) => rest;

const toForm = (s) => ({
  shop: { ...s.shop },
  freeShippingThreshold: String(s.shipping.freeShippingThreshold),
  cutoffHour: String(s.shipping.cutoffHour),
  offDays: [...s.shipping.offDays],
  methods: s.shipping.methods.map((m) => ({
    rid: rid(), id: m.id, title: m.title, cost: String(m.cost),
    etaMin: String(m.etaDays[0]), etaMax: String(m.etaDays[1]), cities: [...m.cities], _new: false,
  })),
  timeSlots: s.shipping.timeSlots.map((t) => ({ rid: rid(), id: t.id, label: t.label, _new: false })),
  cities: s.cities.join('\n'),
});

function toSettings(f, current) {
  const cities = parseCities(f.cities);
  return {
    shop: Object.fromEntries(Object.entries(f.shop).map(([k, v]) => [k, String(v).trim()])),
    cities,
    shipping: {
      ...current.shipping, // فیلدهای ناشناخته (مثل processingHours) حفظ می‌شوند
      freeShippingThreshold: Math.round(parseNumber(f.freeShippingThreshold)),
      cutoffHour: parseNumber(f.cutoffHour),
      offDays: [...f.offDays].sort((a, b) => a - b),
      methods: f.methods.map((m) => ({
        id: m.id.trim(),
        title: m.title.trim(),
        cost: Math.round(parseNumber(m.cost)),
        etaDays: [parseNumber(m.etaMin), parseNumber(m.etaMax)],
        cities: m.cities.filter((c) => cities.includes(c)),
      })),
      timeSlots: f.timeSlots.map((t) => ({ id: t.id.trim(), label: t.label.trim() })),
    },
  };
}

function validate(f) {
  const e = {};
  const s = f.shop;
  if (s.name.trim().length < 2) e['shop-name'] = 'نام فروشگاه را وارد کن.';
  if (s.phone.trim().length < 5) e['shop-phone'] = 'شماره تماس را وارد کن.';
  if (!EMAIL_RE.test(s.email.trim())) e['shop-email'] = 'ایمیل معتبر نیست.';
  if (s.address.trim().length < 5) e['shop-address'] = 'نشانی را وارد کن.';
  if (s.workingHours.trim().length < 3) e['shop-workingHours'] = 'ساعت کاری را وارد کن.';

  if (!(parseNumber(f.freeShippingThreshold) >= 0)) {
    e.freeShippingThreshold = 'یک عدد معتبر (تومان) وارد کن؛ ۰ یعنی ارسال همیشه رایگان.';
  }
  if (!isInt(parseNumber(f.cutoffHour), 0, 23)) e.cutoffHour = 'ساعت باید عدد صحیح بین ۰ تا ۲۳ باشد.';
  if (f.offDays.length >= 7) e.offDays = 'حداقل یک روز هفته باید کاری باشد.';

  if (f.methods.length === 0) e.methods = 'حداقل یک روش ارسال لازم است.';
  const mIds = new Set();
  f.methods.forEach((m, i) => {
    const id = m.id.trim();
    if (!ID_RE.test(id)) e[`method-${i}-id`] = 'کد انگلیسی (مثال: express).';
    else if (mIds.has(id)) e[`method-${i}-id`] = 'کد تکراری است.';
    mIds.add(id);
    if (m.title.trim().length < 2) e[`method-${i}-title`] = 'عنوان را وارد کن.';
    if (!isInt(parseNumber(m.cost), 0, 10_000_000)) e[`method-${i}-cost`] = 'هزینه باید عدد صحیح (تومان) باشد.';
    const min = parseNumber(m.etaMin);
    const max = parseNumber(m.etaMax);
    if (!isInt(min, 0, 30) || !isInt(max, 0, 30) || min > max) {
      e[`method-${i}-eta`] = 'بازه‌ی روز معتبر نیست (۰ تا ۳۰ و حداقل ≤ حداکثر).';
    }
  });

  if (f.timeSlots.length === 0) e.slots = 'حداقل یک بازه‌ی ساعتی لازم است.';
  const sIds = new Set();
  f.timeSlots.forEach((t, i) => {
    const id = t.id.trim();
    if (!ID_RE.test(id)) e[`slot-${i}-id`] = 'کد انگلیسی (مثال: morning).';
    else if (sIds.has(id)) e[`slot-${i}-id`] = 'کد تکراری است.';
    sIds.add(id);
    if (t.label.trim().length < 3) e[`slot-${i}-label`] = 'برچسب را وارد کن (مثال: ۹ تا ۱۲).';
  });

  if (parseCities(f.cities).length === 0) e.cities = 'حداقل یک شهر وارد کن.';
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

function SettingsForm({ current, base }) {
  const [form, setForm] = useState(() => toForm(current));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  const cityList = useMemo(() => parseCities(form.cities), [form.cities]);

  const clear = (prefix) => {
    setSaved(false);
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k, v]) => v && !k.startsWith(prefix))));
  };
  const setShop = (k, v) => { setForm((f) => ({ ...f, shop: { ...f.shop, [k]: v } })); clear(`shop-${k}`); };
  const setField = (k, v) => { setForm((f) => ({ ...f, [k]: v })); clear(k); };
  const setMethod = (i, patch) => {
    setForm((f) => ({ ...f, methods: f.methods.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) }));
    clear(`method-${i}-`);
  };
  const setSlot = (i, patch) => {
    setForm((f) => ({ ...f, timeSlots: f.timeSlots.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));
    clear(`slot-${i}-`);
  };
  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      offDays: f.offDays.includes(day) ? f.offDays.filter((d) => d !== day) : [...f.offDays, day],
    }));
    clear('offDays');
  };
  const toggleMethodCity = (i, city) => {
    const m = form.methods[i];
    setMethod(i, { cities: m.cities.includes(city) ? m.cities.filter((c) => c !== city) : [...m.cities, city] });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setSaved(false);

    const errs = validate(form);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`sf-${first}`)?.focus();
      return;
    }
    if (!saveSettings(toSettings(form, current), base)) {
      setFormError('ذخیره ممکن نشد (حافظه‌ی مرورگر پر یا مسدود است).');
      return;
    }
    setSaved(true);
  };

  const err = (k) => errors[k];
  const chip = 'flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm';

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* اطلاعات فروشگاه */}
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="sf-shop">
        <h2 id="sf-shop" className="font-bold text-lajevard">۱. اطلاعات فروشگاه</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SHOP_FIELDS.map(([key, label]) => (
            <Field key={key} id={`sf-shop-${key}`} label={label} error={err(`shop-${key}`)}>
              <input
                id={`sf-shop-${key}`}
                className="input"
                dir={LTR_FIELDS.includes(key) ? 'ltr' : undefined}
                value={form.shop[key] ?? ''}
                onChange={(e) => setShop(key, e.target.value)}
                aria-invalid={Boolean(err(`shop-${key}`))}
                aria-describedby={err(`shop-${key}`) ? `sf-shop-${key}-err` : undefined}
              />
            </Field>
          ))}
        </div>
      </section>

      {/* قوانین ارسال */}
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="sf-ship">
        <h2 id="sf-ship" className="font-bold text-lajevard">۲. قوانین ارسال</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="sf-freeShippingThreshold"
            label="حداقل مبلغ سفارش برای ارسال رایگان (تومان)"
            error={err('freeShippingThreshold')}
          >
            <input
              id="sf-freeShippingThreshold"
              className="input"
              dir="ltr"
              inputMode="numeric"
              value={form.freeShippingThreshold}
              onChange={(e) => setField('freeShippingThreshold', e.target.value)}
              aria-invalid={Boolean(err('freeShippingThreshold'))}
              aria-describedby={err('freeShippingThreshold') ? 'sf-freeShippingThreshold-err' : undefined}
            />
          </Field>
          <Field
            id="sf-cutoffHour"
            label="ساعت پایان پذیرش سفارش همان‌روز"
            error={err('cutoffHour')}
            hint="سفارش بعد از این ساعت، از فردا پردازش می‌شود."
          >
            <input
              id="sf-cutoffHour"
              className="input"
              dir="ltr"
              inputMode="numeric"
              value={form.cutoffHour}
              onChange={(e) => setField('cutoffHour', e.target.value)}
              aria-invalid={Boolean(err('cutoffHour'))}
              aria-describedby={err('cutoffHour') ? 'sf-cutoffHour-err' : undefined}
            />
          </Field>
        </div>

        <fieldset id="sf-offDays" tabIndex={-1}>
          <legend className="mb-2 text-sm font-medium">روزهای تعطیل (ارسال و پردازش انجام نمی‌شود)</legend>
          <div className="flex flex-wrap gap-2">
            {WEEK.map(({ day, label }) => (
              <label key={day} className={chip}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-firouzeh"
                  checked={form.offDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                {label}
              </label>
            ))}
          </div>
          {err('offDays') && <p role="alert" className="mt-1 text-xs text-anar">{err('offDays')}</p>}
        </fieldset>
      </section>

      {/* روش‌های ارسال */}
      <section id="sf-methods" tabIndex={-1} className="card space-y-4 p-4 sm:p-5" aria-labelledby="sf-methods-h">
        <h2 id="sf-methods-h" className="font-bold text-lajevard">۳. روش‌های ارسال</h2>
        {err('methods') && <p role="alert" className="text-xs text-anar">{err('methods')}</p>}

        {form.methods.map((m, i) => (
          <div key={m.rid} className="space-y-3 rounded-xl border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id={`sf-method-${i}-title`} label="عنوان" error={err(`method-${i}-title`)}>
                <input
                  id={`sf-method-${i}-title`}
                  className="input"
                  value={m.title}
                  onChange={(e) => setMethod(i, { title: e.target.value })}
                  aria-invalid={Boolean(err(`method-${i}-title`))}
                  aria-describedby={err(`method-${i}-title`) ? `sf-method-${i}-title-err` : undefined}
                />
              </Field>
              <Field
                id={`sf-method-${i}-id`}
                label="کد (انگلیسی)"
                error={err(`method-${i}-id`)}
                hint={m._new ? undefined : 'قابل تغییر نیست.'}
              >
                <input
                  id={`sf-method-${i}-id`}
                  className="input"
                  dir="ltr"
                  disabled={!m._new}
                  value={m.id}
                  onChange={(e) => setMethod(i, { id: e.target.value })}
                  aria-invalid={Boolean(err(`method-${i}-id`))}
                  aria-describedby={err(`method-${i}-id`) ? `sf-method-${i}-id-err` : undefined}
                />
              </Field>
              <Field id={`sf-method-${i}-cost`} label="هزینه (تومان)" error={err(`method-${i}-cost`)}>
                <input
                  id={`sf-method-${i}-cost`}
                  className="input"
                  dir="ltr"
                  inputMode="numeric"
                  value={m.cost}
                  onChange={(e) => setMethod(i, { cost: e.target.value })}
                  aria-invalid={Boolean(err(`method-${i}-cost`))}
                  aria-describedby={err(`method-${i}-cost`) ? `sf-method-${i}-cost-err` : undefined}
                />
              </Field>
              <div>
                <label htmlFor={`sf-method-${i}-eta`} className="mb-1.5 block text-sm font-medium">
                  بازه‌ی تحویل (روز؛ ۰ یعنی همان‌روز)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`sf-method-${i}-eta`}
                    className="input"
                    dir="ltr"
                    inputMode="numeric"
                    aria-label="حداقل روز"
                    value={m.etaMin}
                    onChange={(e) => setMethod(i, { etaMin: e.target.value })}
                    aria-invalid={Boolean(err(`method-${i}-eta`))}
                  />
                  <span className="text-sm text-slate-500">تا</span>
                  <input
                    className="input"
                    dir="ltr"
                    inputMode="numeric"
                    aria-label="حداکثر روز"
                    value={m.etaMax}
                    onChange={(e) => setMethod(i, { etaMax: e.target.value })}
                    aria-invalid={Boolean(err(`method-${i}-eta`))}
                  />
                </div>
                {err(`method-${i}-eta`) && <p role="alert" className="mt-1 text-xs text-anar">{err(`method-${i}-eta`)}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  روشی که حداکثرش ۱ روز یا کمتر باشد، در چک‌اوت بازه‌ی ساعتی هم نشان می‌دهد.
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">شهرهای مجاز (هیچ‌کدام = همه‌ی شهرها)</legend>
              <div className="flex flex-wrap gap-2">
                {cityList.map((c) => (
                  <label key={c} className={chip}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-firouzeh"
                      checked={m.cities.includes(c)}
                      onChange={() => toggleMethodCity(i, c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              className="btn-outline px-3 py-1.5 text-anar"
              disabled={form.methods.length === 1}
              onClick={() => setForm((f) => ({ ...f, methods: f.methods.filter((_, idx) => idx !== i) }))}
            >
              حذف این روش
            </button>
          </div>
        ))}

        {form.methods.length < MAX_METHODS && (
          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              setForm((f) => ({
                ...f,
                methods: [...f.methods, { rid: rid(), id: '', title: '', cost: '0', etaMin: '1', etaMax: '3', cities: [], _new: true }],
              }))
            }
          >
            + افزودن روش ارسال
          </button>
        )}
      </section>

      {/* بازه‌های ساعتی */}
      <section id="sf-slots" tabIndex={-1} className="card space-y-4 p-4 sm:p-5" aria-labelledby="sf-slots-h">
        <h2 id="sf-slots-h" className="font-bold text-lajevard">۴. بازه‌های ساعتی تحویل</h2>
        {err('slots') && <p role="alert" className="text-xs text-anar">{err('slots')}</p>}

        {form.timeSlots.map((t, i) => (
          <div key={t.rid} className="flex flex-wrap items-start gap-3">
            <div className="min-w-40 flex-1">
              <Field id={`sf-slot-${i}-label`} label="برچسب" error={err(`slot-${i}-label`)}>
                <input
                  id={`sf-slot-${i}-label`}
                  className="input"
                  value={t.label}
                  onChange={(e) => setSlot(i, { label: e.target.value })}
                  aria-invalid={Boolean(err(`slot-${i}-label`))}
                  aria-describedby={err(`slot-${i}-label`) ? `sf-slot-${i}-label-err` : undefined}
                />
              </Field>
            </div>
            <div className="min-w-40 flex-1">
              <Field id={`sf-slot-${i}-id`} label="کد (انگلیسی)" error={err(`slot-${i}-id`)}>
                <input
                  id={`sf-slot-${i}-id`}
                  className="input"
                  dir="ltr"
                  disabled={!t._new}
                  value={t.id}
                  onChange={(e) => setSlot(i, { id: e.target.value })}
                  aria-invalid={Boolean(err(`slot-${i}-id`))}
                  aria-describedby={err(`slot-${i}-id`) ? `sf-slot-${i}-id-err` : undefined}
                />
              </Field>
            </div>
            <button
              type="button"
              className="btn-outline mt-7 px-3 py-2 text-anar"
              disabled={form.timeSlots.length === 1}
              onClick={() => setForm((f) => ({ ...f, timeSlots: f.timeSlots.filter((_, idx) => idx !== i) }))}
            >
              حذف
            </button>
          </div>
        ))}

        {form.timeSlots.length < MAX_SLOTS && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => setForm((f) => ({ ...f, timeSlots: [...f.timeSlots, { rid: rid(), id: '', label: '', _new: true }] }))}
          >
            + افزودن بازه
          </button>
        )}
      </section>

      {/* شهرها */}
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="sf-cities-h">
        <h2 id="sf-cities-h" className="font-bold text-lajevard">۵. شهرهای قابل ارسال</h2>
        <Field id="sf-cities" label="هر شهر در یک خط" error={err('cities')}>
          <textarea
            id="sf-cities"
            className="input min-h-40"
            rows={8}
            value={form.cities}
            onChange={(e) => setField('cities', e.target.value)}
            aria-invalid={Boolean(err('cities'))}
            aria-describedby={err('cities') ? 'sf-cities-err' : undefined}
          />
        </Field>
        <p className="text-xs text-slate-400">اگر شهری را حذف کنی، از شهرهای مجاز روش‌های ارسال هم کنار گذاشته می‌شود.</p>
      </section>

      {formError && <p className="rounded-xl bg-red-50 p-3 text-sm text-anar" role="alert">{formError}</p>}
      {Object.values(errors).some(Boolean) && (
        <p className="text-sm text-anar" role="alert">لطفاً فیلدهای علامت‌دار را اصلاح کن.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">ذخیره تنظیمات</button>
        {saved && <span className="text-sm text-firouzeh-dark" role="status">✓ ذخیره شد و در سبد و چک‌اوت اعمال می‌شود</span>}
      </div>
    </form>
  );
}

function DataTools({ products }) {
  const { categories: baseCategories } = useBaseData();
  const settings = useSettings();
  const [prodOverlay] = useStore('products', {});
  const [catOverlay] = useStore('categories', {});

  const exportProducts = () =>
    downloadJSON('products.json', getProductStates(products, prodOverlay).filter((p) => p._state !== 'deleted').map(strip));
  const exportCategories = () =>
    downloadJSON('categories.json', getCategoryStates(baseCategories, catOverlay).filter((c) => c._state !== 'deleted').map(strip));
  const exportSettings = () => downloadJSON('settings.json', settings);

  const resetCatalog = () => {
    if (window.confirm('همه‌ی تغییرات محصولات، دسته‌ها و تنظیمات پاک شود و به فایل‌های JSON برگردند؟ (سفارش‌ها و کاربران دست نمی‌خورند.)')) {
      resetAllProducts();
      resetAllCategories();
      resetSettings();
    }
  };

  return (
    <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="sf-tools">
      <h2 id="sf-tools" className="font-bold text-lajevard">خروجی JSON و بازنشانی</h2>
      <p className="rounded-xl bg-lajevard-light p-3 text-xs leading-6 text-lajevard-dark">
        برای دائمی کردن تغییرات: سه فایل را دانلود کن و داخل <code dir="ltr">public/data/</code> جایگزین کن، سپس
        «بازنشانی» را بزن. بدون بازنشانی، کالاها و دسته‌های افزوده‌شده دوبار نمایش داده می‌شوند.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportProducts} className="btn-outline">⬇️ products.json</button>
        <button type="button" onClick={exportCategories} className="btn-outline">⬇️ categories.json</button>
        <button type="button" onClick={exportSettings} className="btn-outline">⬇️ settings.json</button>
        <button type="button" onClick={resetCatalog} className="btn-outline text-anar">بازنشانی تغییرات کاتالوگ</button>
      </div>
    </section>
  );
}

export default function AdminSettingsView({ products }) {
  const current = useSettings();
  const { settings: base } = useBaseData();
  const [overlay, , ready] = useStore('settings', {});
  const [version, setVersion] = useState(0);

  if (!ready) return <div className="card h-96 animate-pulse bg-slate-100" aria-busy="true" />;

  const changed = hasSettingsOverlay(overlay);

  const onReset = () => {
    if (window.confirm('تنظیمات به مقادیر فایل settings.json برگردد؟')) {
      resetSettings();
      setVersion((v) => v + 1); // بازسازی فرم با مقادیر جدید
    }
  };

  return (
    <div className="space-y-6">
      {changed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zaferan/20 p-3 text-sm text-amber-900">
          <span>تنظیمات این مرورگر با فایل JSON تفاوت دارد.</span>
          <button type="button" onClick={onReset} className="font-medium underline">بازنشانی تنظیمات</button>
        </div>
      )}

      <SettingsForm key={version} current={current} base={base} />
      <DataTools products={products} />
    </div>
  );
}