import { formatNumber } from '@/lib/format';

/** نمایش مقدار مشخصات: bool → بله/خیر، عدد → فارسی + واحد */
export function formatSpec(item, value) {
  if (value == null || value === '') return '—';
  if (item.type === 'bool') return value ? 'بله' : 'خیر';
  if (typeof value === 'number') return `${formatNumber(value)}${item.unit ? ` ${item.unit}` : ''}`;
  return String(value);
}

/**
 * values: آرایه‌ی عددها (یا null برای نبودن مقدار)
 * better: 'higher' | 'lower' | null
 * خروجی: ایندکس‌های برتر؛ اگه همه برابرن یا کمتر از ۲ مقدار هست، خالی
 */
export function bestIndexes(values, better) {
  if (better !== 'higher' && better !== 'lower') return [];
  const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (nums.length < 2 || new Set(nums).size === 1) return [];
  const best = better === 'higher' ? Math.max(...nums) : Math.min(...nums);
  return values.reduce((acc, v, i) => (v === best ? [...acc, i] : acc), []);
}