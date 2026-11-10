export const SITE_NAME = 'دیجی مو';
export const MAX_QTY = 10;     // سقف تعداد هر کالا در سبد
export const MAX_COMPARE = 4;  // سقف کالاهای مقایسه
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://digimo.example';
export const ORDER_STEPS = [
  { key: 'placed', label: 'ثبت سفارش' },
  { key: 'processing', label: 'آماده‌سازی' },
  { key: 'shipped', label: 'ارسال شد' },
  { key: 'delivered', label: 'تحویل داده شد' },
];
export const ORDER_STATUS_LABEL = {
  ...Object.fromEntries(ORDER_STEPS.map((s) => [s.key, s.label])),
  canceled: 'لغو شده',
};

export const ORDER_STATUS_STYLE = {
  placed: 'bg-slate-100 text-slate-700',
  processing: 'bg-zaferan/20 text-amber-800',
  shipped: 'bg-lajevard-light text-lajevard',
  delivered: 'bg-firouzeh/15 text-firouzeh-dark',
  canceled: 'bg-red-50 text-anar',
};