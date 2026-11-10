'use client';

import { useContext } from 'react';
import { DataContext } from '@/components/ui/Providers';

function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('<Providers> در app/layout.js اضافه نشده است.');
  return value;
}

export const useSettings = () => useData().settings;     // ادغام JSON + تغییرات ادمین
export const useCategories = () => useData().categories; // مرتب بر اساس order، بدون حذف‌شده‌ها
export const useBaseData = () => useData().base;         // { categories, settings } فقط از فایل JSON