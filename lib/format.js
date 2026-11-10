const TZ = 'Asia/Tehran'; // ثابت بودن timezone جلوی Hydration Mismatch تاریخ‌ها رو می‌گیره

const numberFa = new Intl.NumberFormat('fa-IR');

const dateFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  dateStyle: 'long',
  timeZone: TZ,
});

const dateTimeFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TZ,
});

export const formatNumber = (n) => numberFa.format(Number(n) || 0);

// قیمت‌ها همه‌جا Number و به تومان نگه داشته میشن
export const formatPrice = (n) => `${numberFa.format(Math.round(Number(n) || 0))} تومان`;

export const calcFinalPrice = (price, discountPercent = 0) =>
  Math.round(price * (1 - discountPercent / 100));

export const formatDate = (iso) => dateFa.format(new Date(iso));
export const formatDateTime = (iso) => dateTimeFa.format(new Date(iso));

// تبدیل ارقام فارسی/عربی به انگلیسی (برای فرم‌ها: موبایل، کد پستی)
export const toEnglishDigits = (str = '') =>
  String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

export const isValidIranMobile = (v) => /^09\d{9}$/.test(toEnglishDigits(v).trim());

// نرمال‌سازی متن فارسی برای جستجو (ی/ک عربی، نیم‌فاصله، ارقام)
export const normalizeFa = (s = '') =>
  toEnglishDigits(s)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .toLowerCase()
    .trim();

export const isValidPostalCode = (v) => /^\d{10}$/.test(toEnglishDigits(v).trim());

// رشته‌ی عددی فارسی/انگلیسی (با جداکننده‌ی هزارگان) → Number؛ خالی یا نامعتبر → NaN
export const parseNumber = (v) => {
  const s = toEnglishDigits(String(v ?? '')).replace(/[٬,\s]/g, '').replace(/٫/g, '.');
  return s === '' ? NaN : Number(s);
};

