import { readStore, writeStore } from '@/services/dataService';

const EMPTY = { added: [], edited: {}, deleted: [] };

/** base: محصولات پایه‌ی JSON. خروجی: موفقیت ذخیره (true/false) */
export function adjustStock(deltas, base = []) {
  const o = { ...EMPTY, ...readStore('products', {}) };
  const added = [...o.added];
  const edited = { ...o.edited };

  for (const { id, delta } of deltas) {
    // کالای اضافه‌شده توسط ادمین
    const ai = added.findIndex((p) => p.id === id);
    if (ai >= 0) {
      added[ai] = { ...added[ai], stock: Math.max(0, added[ai].stock + delta) };
      continue;
    }

    // کالای پایه
    const b = base.find((p) => p.id === id);
    if (!b) continue; // کالا دیگر وجود ندارد

    const current = edited[id]?.stock ?? b.stock;
    const next = Math.max(0, current + delta);

    const { stock: _old, ...rest } = edited[id] ?? {};
    const entry = next === b.stock ? rest : { ...rest, stock: next };
    if (Object.keys(entry).length) edited[id] = entry;
    else delete edited[id];
  }

  return writeStore('products', { ...o, added, edited });
}