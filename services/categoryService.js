import { readStore, writeStore, removeStore, uid } from '@/services/dataService';

const EMPTY = { added: [], edited: {}, deleted: [] };
const getOverlay = () => ({ ...EMPTY, ...readStore('categories', {}) });
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

const stable = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      : x
  );

/** همه‌ی دسته‌ها (حتی حذف‌شده‌ها) با _state: base | edited | added | deleted */
export function getCategoryStates(base = [], overlay = {}) {
  const o = { ...EMPTY, ...overlay };
  const fromBase = base.map((c) => {
    const deleted = o.deleted.includes(c.id);
    const edit = o.edited[c.id];
    return { ...c, ...(edit ?? {}), _state: deleted ? 'deleted' : edit ? 'edited' : 'base' };
  });
  const added = o.added.map((c) => ({ ...c, _state: 'added' }));
  return [...fromBase, ...added].sort(byOrder);
}

/** values شامل slug هم هست */
export function createCategory(values) {
  const o = getOverlay();
  const category = { ...values, id: uid('c') };
  return writeStore('categories', { ...o, added: [...o.added, category] }) ? category : null;
}

export function updateCategory(id, values, baseCategory = null) {
  const o = getOverlay();

  if (o.added.some((c) => c.id === id)) {
    return writeStore('categories', {
      ...o,
      added: o.added.map((c) => (c.id === id ? { ...c, ...values } : c)),
    });
  }
  if (!baseCategory) return false;

  const diff = Object.fromEntries(
    Object.entries(values).filter(([k, v]) => stable(v) !== stable(baseCategory[k]))
  );
  const edited = { ...o.edited };
  if (Object.keys(diff).length) edited[id] = diff;
  else delete edited[id];
  return writeStore('categories', { ...o, edited });
}

export function deleteCategory(id) {
  const o = getOverlay();
  if (o.added.some((c) => c.id === id)) {
    return writeStore('categories', { ...o, added: o.added.filter((c) => c.id !== id) });
  }
  if (o.deleted.includes(id)) return true;
  return writeStore('categories', { ...o, deleted: [...o.deleted, id] });
}

export const restoreCategory = (id) => {
  const o = getOverlay();
  return writeStore('categories', { ...o, deleted: o.deleted.filter((x) => x !== id) });
};

export const resetCategory = (id) => {
  const o = getOverlay();
  const edited = { ...o.edited };
  delete edited[id];
  return writeStore('categories', { ...o, edited });
};

export const resetAllCategories = () => removeStore('categories');