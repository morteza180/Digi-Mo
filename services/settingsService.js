import { writeStore, removeStore } from '@/services/dataService';

export const SETTINGS_SECTIONS = ['shop', 'shipping', 'cities'];

// مقایسه‌ی مستقل از ترتیب کلیدها
const stable = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      : x
  );

/** هر بخش تغییرکرده‌ی overlay، بخش متناظر فایل JSON را کامل جایگزین می‌کند */
export function mergeSettings(base, overlay = {}) {
  return {
    ...base,
    shop: { ...base.shop, ...(overlay.shop ?? {}) },
    shipping: { ...base.shipping, ...(overlay.shipping ?? {}) },
    cities: overlay.cities ?? base.cities,
  };
}

/** فقط بخش‌هایی که با فایل JSON فرق دارند ذخیره می‌شوند */
export function saveSettings(next, base) {
  const overlay = {};
  for (const key of SETTINGS_SECTIONS) {
    if (stable(next[key]) !== stable(base[key])) overlay[key] = next[key];
  }
  if (Object.keys(overlay).length === 0) {
    removeStore('settings');
    return true;
  }
  return writeStore('settings', overlay);
}

export const resetSettings = () => removeStore('settings');

export const hasSettingsOverlay = (overlay) =>
  SETTINGS_SECTIONS.some((k) => overlay?.[k] !== undefined);