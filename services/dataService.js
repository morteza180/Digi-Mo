export const STORE_KEYS = {
  products: 'digimo:products-overlay', // { added: [], edited: {}, deleted: [] }
  categories: 'digimo:categories-overlay',
  settings: 'digimo:settings-overlay',
  orders: 'digimo:orders',
  users: 'digimo:users',
  session: 'digimo:session',
  cart: 'digimo:cart',
  wishlist: 'digimo:wishlist',
  compare: 'digimo:compare',
  messages: 'digimo:messages',
};

const isBrowser = () => typeof window !== 'undefined';

export function readStore(key, fallback) {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(STORE_KEYS[key]);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; // JSON خراب، یا localStorage مسدود (حالت private/تنظیمات مرورگر)
  }
}

// خروجی true/false: موفقیت ذخیره
export function writeStore(key, value) {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(STORE_KEYS[key], JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('digimo:store', { detail: key }));
    return true;
  } catch (e) {
    console.error(`[dataService] write "${key}" failed (quota?)`, e);
    return false;
  }
}

export function removeStore(key) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORE_KEYS[key]);
  window.dispatchEvent(new CustomEvent('digimo:store', { detail: key }));
}

export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ادغام داده‌ی پایه (JSON سرور) با تغییرات ادمین؛ overlay برنده است
export function mergeCollection(base = [], overlay = {}) {
  const { added = [], edited = {}, deleted = [] } = overlay;
  const merged = base
    .filter((item) => !deleted.includes(item.id))
    .map((item) => (edited[item.id] ? { ...item, ...edited[item.id] } : item));
  return [...merged, ...added];
}

// دانلود فایل JSON برای «خروجی JSON» پنل ادمین
export function downloadJSON(filename, data) {
  if (!isBrowser()) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}