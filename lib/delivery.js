// ایران از سال ۱۴۰۱ ساعت تابستانی ندارد؛ اختلاف ثابت UTC+3:30
// منطق عمداً مستقل از timezone دستگاه کاربر است تا همه جا نتیجه‌ی یکسان بدهد.
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const toTehran = (date) => new Date(date.getTime() + TEHRAN_OFFSET_MS); // با getUTC* بخوان
const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);
const isOff = (d, offDays) => offDays.includes(d.getUTCDay()); // جمعه = 5

function nextOpenDay(d, offDays) {
  let x = d;
  for (let i = 0; i < 7 && isOff(x, offDays); i++) x = addDays(x, 1);
  return x;
}

// ظهرِ همان روز به وقت تهران؛ فرمت با timeZone: 'Asia/Tehran' همیشه تاریخ درست را نشان می‌دهد
const toNoonISO = (d) =>
  new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12) - TEHRAN_OFFSET_MS
  ).toISOString();

/** روش‌های ارسالِ قابل‌استفاده برای یک شهر (cities خالی = همه‌ی شهرها) */
export function getShippingMethods(settings, city) {
  const { methods } = settings.shipping;
  if (!city) return methods;
  return methods.filter((m) => m.cities.length === 0 || m.cities.includes(city));
}

/** هزینه‌ی ارسال؛ بالاتر از آستانه رایگان */
export function calcShipping(subtotal, method, settings) {
  if (!method) return 0;
  if (subtotal >= settings.shipping.freeShippingThreshold) return 0;
  return method.cost;
}

/**
 * بازه‌ی تحویل: { from, to } به‌صورت ISO (ظهر همان روز به وقت تهران)
 * - بعد از ساعت cutoffHour پردازش از فردا شروع میشه
 * - روزهای تعطیل (offDays) رد میشن
 */
export function estimateDelivery(method, settings, now = new Date()) {
  const { cutoffHour, offDays } = settings.shipping;

  let start = toTehran(now);
  if (start.getUTCHours() >= cutoffHour) start = addDays(start, 1);
  start = nextOpenDay(start, offDays);

  const [min, max] = method.etaDays;
  const from = nextOpenDay(addDays(start, min), offDays);
  const to = nextOpenDay(addDays(start, max), offDays);

  return { from: toNoonISO(from), to: toNoonISO(to) };
}