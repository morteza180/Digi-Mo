import { readStore, writeStore, removeStore, uid } from '@/services/dataService';
import { adjustStock } from '@/services/stockService';
const EMPTY = { added: [], edited: {}, deleted: [] };

const getOverlay = () => ({ ...EMPTY, ...readStore('products', {}) });

// مقایسه‌ی مستقل از ترتیب کلیدها
const stable = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      : x
  );

/** همه‌ی محصولات (حتی حذف‌شده‌ها) با _state: base | edited | added | deleted */
export function getProductStates(base = [], overlay = {}) {
  const o = { ...EMPTY, ...overlay };
  const fromBase = base.map((p) => {
    const deleted = o.deleted.includes(p.id);
    const edit = o.edited[p.id];
    return { ...p, ...(edit ?? {}), _state: deleted ? 'deleted' : edit ? 'edited' : 'base' };
  });
  const added = o.added.map((p) => ({ ...p, _state: 'added' }));
  return [...fromBase, ...added];
}

/** values شامل slug هم هست؛ خروجی: محصول ساخته‌شده یا null اگر ذخیره نشد */
export function createProduct(values) {
  const o = getOverlay();
  const product = { ...values, id: uid('p'), createdAt: new Date().toISOString() };
  return writeStore('products', { ...o, added: [...o.added, product] }) ? product : null;
}

/** baseProduct: نسخه‌ی اصلیِ JSON (برای محصولات اضافه‌شده null) */
export function updateProduct(id, values, baseProduct = null) {
  const o = getOverlay();

  if (o.added.some((p) => p.id === id)) {
    return writeStore('products', {
      ...o,
      added: o.added.map((p) => (p.id === id ? { ...p, ...values } : p)),
    });
  }
  if (!baseProduct) return false;

  const diff = Object.fromEntries(
    Object.entries(values).filter(([k, v]) => stable(v) !== stable(baseProduct[k]))
  );
  const edited = { ...o.edited };
  if (Object.keys(diff).length) edited[id] = diff;
  else delete edited[id];
  return writeStore('products', { ...o, edited });
}

export function deleteProduct(id) {
  const o = getOverlay();
  if (o.added.some((p) => p.id === id)) {
    return writeStore('products', { ...o, added: o.added.filter((p) => p.id !== id) });
  }
  if (o.deleted.includes(id)) return true;
  return writeStore('products', { ...o, deleted: [...o.deleted, id] });
}

export function restoreProduct(id) {
  const o = getOverlay();
  return writeStore('products', { ...o, deleted: o.deleted.filter((x) => x !== id) });
}

/** برگرداندن ویرایش‌های یک محصول پایه به حالت فایل JSON */
export function resetProduct(id) {
  const o = getOverlay();
  const edited = { ...o.edited };
  delete edited[id];
  return writeStore('products', { ...o, edited });
}

export function resetAllProducts() {
  removeStore('products');
}

/* ---------------------------- سفارش‌ها ---------------------------- */

export const NEXT_STATUS = {
  placed: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};
export const CANCELABLE = ['placed', 'processing', 'shipped'];
export const ACTION_LABEL = {
  processing: 'شروع آماده‌سازی',
  shipped: 'علامت‌گذاری «ارسال شد»',
  delivered: 'علامت‌گذاری «تحویل داده شد»',
};

/**
 * فقط یک قدم جلو (placed → processing → shipped → delivered) یا لغو.
 * «تحویل‌شده» و «لغوشده» نهایی هستند.
 * لغو، موجودی را (فقط اگر هنگام ثبت کم شده بود) برمی‌گرداند.
 * base: محصولات پایه‌ی JSON. در صورت خطا Error با پیام فارسی پرتاب می‌کند.
 */
export function updateOrderStatus(orderId, next, base = []) {
  const orders = readStore('orders', []);
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error('سفارش پیدا نشد.');

  const allowed = next === 'canceled' ? CANCELABLE.includes(order.status) : NEXT_STATUS[order.status] === next;
  if (!allowed) throw new Error('این تغییر وضعیت برای سفارش مجاز نیست.');

  if (next === 'canceled' && order.stockReserved) {
    const ok = adjustStock(order.items.map((i) => ({ id: i.id, delta: i.qty })), base);
    if (!ok) throw new Error('بازگرداندن موجودی ممکن نشد (حافظه‌ی مرورگر پر یا مسدود است).');
  }

  const updated = {
    ...order,
    status: next,
    stockReserved: next === 'canceled' ? false : order.stockReserved,
    statusHistory: [...(order.statusHistory ?? []), { status: next, at: new Date().toISOString() }],
  };

  if (!writeStore('orders', orders.map((o) => (o.id === orderId ? updated : o)))) {
    throw new Error('ذخیره‌ی تغییر ممکن نشد.');
  }
  return updated;
}

/* ----------------------------- کاربران ----------------------------- */

const adminCount = (users) => users.filter((u) => u.role === 'admin').length;

export function setUserRole(userId, role, actorId) {
  if (!['admin', 'customer'].includes(role)) throw new Error('نقش نامعتبر است.');
  if (userId === actorId) throw new Error('نقش حساب خودت را نمی‌توانی تغییر بدهی.');

  const users = readStore('users', []);
  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error('کاربر پیدا نشد.');
  if (target.role === 'admin' && role !== 'admin' && adminCount(users) <= 1) {
    throw new Error('حداقل یک ادمین باید باقی بماند.');
  }

  writeStore('users', users.map((u) => (u.id === userId ? { ...u, role } : u)));
}

/** سفارش‌های کاربر حذف‌شده برای سوابق باقی می‌مانند؛ فقط ذخیره‌ها و نشست او پاک می‌شود */
export function deleteUser(userId, actorId) {
  if (userId === actorId) throw new Error('حساب خودت را نمی‌توانی حذف کنی.');

  const users = readStore('users', []);
  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error('کاربر پیدا نشد.');
  if (target.role === 'admin' && adminCount(users) <= 1) {
    throw new Error('آخرین ادمین را نمی‌شود حذف کرد.');
  }

  writeStore('users', users.filter((u) => u.id !== userId));

  const wishlist = readStore('wishlist', {});
  if (wishlist && !Array.isArray(wishlist) && wishlist[userId]) {
    const { [userId]: _removed, ...rest } = wishlist;
    writeStore('wishlist', rest);
  }

  const session = readStore('session', null);
  if (session?.id === userId) removeStore('session');
}