import { readStore, writeStore, removeStore, uid } from '@/services/dataService';

export class AuthError extends Error {
  constructor(message, field = 'form') {
    super(message);
    this.name = 'AuthError';
    this.field = field;
  }
}

// حساب ادمین نمونه برای نمایش پنل مدیریت (فقط دمو؛ اطلاعاتش عمومی است)
export const DEMO_ADMIN = {
  name: 'مدیر فروشگاه',
  email: 'admin@digimo.example',
  password: 'Admin@123',
};

const ITERATIONS = 100_000;
const enc = new TextEncoder();
const DUMMY_SALT = 'AAAAAAAAAAAAAAAAAAAAAA=='; // برای یکسان‌سازی زمان پاسخ وقتی ایمیل وجود ندارد

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const newSalt = () => toB64(crypto.getRandomValues(new Uint8Array(16)));

function getSubtle() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new AuthError('مرورگر امکان رمزنگاری ندارد. سایت باید روی HTTPS (یا localhost) باز شود.');
  }
  return subtle;
}

async function hashPassword(password, salt) {
  const subtle = getSubtle();
  const key = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(salt), iterations: ITERATIONS },
    key,
    256
  );
  return toB64(bits);
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const normalizeEmail = (v = '') => v.trim().toLowerCase();
export const validateEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const validatePassword = (p = '') => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

// session شامل رمز یا هش نیست
const toSession = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

function startSession(user) {
  const session = toSession(user);
  writeStore('session', session);
  return session;
}

async function ensureSeed() {
  const users = readStore('users', []);
  if (users.some((u) => u.role === 'admin')) return users;

  const salt = newSalt();
  const passwordHash = await hashPassword(DEMO_ADMIN.password, salt);

  const fresh = readStore('users', []); // بعد از await دوباره بخوان
  if (fresh.some((u) => u.role === 'admin')) return fresh;

  const admin = {
    id: uid('usr'),
    name: DEMO_ADMIN.name,
    email: DEMO_ADMIN.email,
    role: 'admin',
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  const next = [admin, ...fresh];
  writeStore('users', next);
  return next;
}

export async function register({ name, email, password }) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 3) throw new AuthError('نام را کامل وارد کن (حداقل ۳ کاراکتر).', 'name');
  if (!validateEmail(cleanEmail)) throw new AuthError('ایمیل معتبر نیست.', 'email');
  if (!validatePassword(password)) {
    throw new AuthError('رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد.', 'password');
  }

  const users = await ensureSeed();
  if (users.some((u) => u.email === cleanEmail)) {
    throw new AuthError('این ایمیل قبلاً ثبت‌نام کرده است.', 'email');
  }

  const salt = newSalt();
  const passwordHash = await hashPassword(password, salt);

  const fresh = readStore('users', []);
  if (fresh.some((u) => u.email === cleanEmail)) {
    throw new AuthError('این ایمیل قبلاً ثبت‌نام کرده است.', 'email');
  }

  const user = {
    id: uid('usr'),
    name: cleanName,
    email: cleanEmail,
    role: 'customer',
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  if (!writeStore('users', [...fresh, user])) {
    throw new AuthError('ذخیره‌ی اطلاعات ممکن نشد (حافظه‌ی مرورگر پر یا مسدود است).');
  }
  return startSession(user);
}

export async function login({ email, password }) {
  const users = await ensureSeed();
  const user = users.find((u) => u.email === normalizeEmail(email));

  // پیام عمداً کلی است تا وجود/عدم وجود ایمیل لو نرود
  const fail = () => new AuthError('ایمیل یا رمز عبور اشتباه است.');

  if (!user) {
    await hashPassword(password, DUMMY_SALT);
    throw fail();
  }
  const hash = await hashPassword(password, user.salt);
  if (!safeEqual(hash, user.passwordHash)) throw fail();

  return startSession(user);
}

export function logout() {
  removeStore('session');
}

export function updateName(name) {
  const session = readStore('session', null);
  if (!session) throw new AuthError('ابتدا وارد حساب کاربری شو.');

  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < 3) throw new AuthError('نام را کامل وارد کن (حداقل ۳ کاراکتر).', 'name');

  writeStore(
    'users',
    readStore('users', []).map((u) => (u.id === session.id ? { ...u, name: clean } : u))
  );
  const next = { ...session, name: clean };
  writeStore('session', next);
  return next;
}