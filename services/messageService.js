import { readStore, writeStore, uid } from '@/services/dataService';
import { toEnglishDigits } from '@/lib/format';

export const SUBJECTS = [
  { id: 'order', label: 'پیگیری سفارش' },
  { id: 'product', label: 'سؤال درباره‌ی کالا' },
  { id: 'return', label: 'مرجوعی و گارانتی' },
  { id: 'suggestion', label: 'پیشنهاد و انتقاد' },
  { id: 'other', label: 'سایر' },
];

const MAX_MESSAGES = 200;      // سقف ذخیره (جلوگیری از پر شدن localStorage)
const COOLDOWN_MS = 20_000;    // فاصله‌ی حداقلی بین دو ارسال

function newCode() {
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  return `MSG-${Array.from(buf, (x) => x % 10).join('')}`;
}

/** پرتاب Error با پیام فارسی در صورت خطا */
export function createMessage({ name, email, mobile, subject, text, userId = null }, now = new Date()) {
  const list = readStore('messages', []);

  if (list[0] && now - new Date(list[0].createdAt) < COOLDOWN_MS) {
    throw new Error('چند ثانیه پیش پیام فرستادی؛ لطفاً کمی صبر کن و دوباره تلاش کن.');
  }

  const message = {
    id: uid('msg'),
    code: newCode(),
    createdAt: now.toISOString(),
    status: 'new',
    userId,
    name: name.trim().replace(/\s+/g, ' '),
    email: email.trim().toLowerCase(),
    mobile: toEnglishDigits(mobile).trim(),
    subject,
    text: text.trim(),
  };

  if (!writeStore('messages', [message, ...list].slice(0, MAX_MESSAGES))) {
    throw new Error('ذخیره‌ی پیام ممکن نشد (حافظه‌ی مرورگر پر یا مسدود است).');
  }
  return message;
}

export function setMessageStatus(id, status) {
  return writeStore(
    'messages',
    readStore('messages', []).map((m) => (m.id === id ? { ...m, status } : m))
  );
}

export function deleteMessage(id) {
  return writeStore('messages', readStore('messages', []).filter((m) => m.id !== id));
}