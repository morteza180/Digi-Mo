import { readStore, writeStore, uid } from '@/services/dataService';
import { calcTotals } from '@/services/cartService';
import { calcShipping, estimateDelivery, getShippingMethods } from '@/lib/delivery';
import { toEnglishDigits } from '@/lib/format';

function randomDigits(n) {
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  return Array.from(buf, (x) => x % 10).join('');
}

function newTrackingCode(orders) {
  let code;
  do {
    code = `DM-${randomDigits(8)}`;
  } while (orders.some((o) => o.trackingCode === code));
  return code;
}

export const findOrder = (orders, code) => orders.find((o) => o.trackingCode === code) ?? null;

/**
 * lines: خروجی resolveLines؛ همه باید status === 'ok' باشند.
 * در صورت خطا Error با پیام فارسی پرتاب می‌کند.
 */
export function createOrder({
  lines, settings, customer, address, methodId,
  timeSlotId = null, note = '', userId = null, now = new Date(),
}) {
  if (lines.length === 0 || lines.some((l) => l.status !== 'ok')) {
    throw new Error('سبد خرید شامل کالای نامعتبر یا ناموجود است. لطفاً سبد را اصلاح کن.');
  }

  const method = getShippingMethods(settings, address.city).find((m) => m.id === methodId);
  if (!method) throw new Error('روش ارسال انتخاب‌شده برای این شهر در دسترس نیست.');

  const totals = calcTotals(lines, settings);
  const shippingCost = calcShipping(totals.subtotal, method, settings);
  const slot = settings.shipping.timeSlots.find((s) => s.id === timeSlotId) ?? null;

  const orders = readStore('orders', []);
  const order = {
    id: uid('ord'),
    trackingCode: newTrackingCode(orders),
    createdAt: now.toISOString(),
    status: 'processing',
    stockReserved: true,
    userId,
    customer: {
      fullName: customer.fullName.trim(),
      mobile: toEnglishDigits(customer.mobile).trim(),
    },
    address: {
      city: address.city,
      address: address.address.trim(),
      postalCode: toEnglishDigits(address.postalCode).trim(),
    },
    shipping: {
      methodId: method.id,
      title: method.title,
      cost: shippingCost,
      eta: estimateDelivery(method, settings, now),
      timeSlot: slot ? { id: slot.id, label: slot.label } : null,
    },
    items: lines.map((l) => ({
      id: l.id,
      slug: l.product.slug,
      name: l.product.name,
      image: l.product.image,
      color: l.color,
      qty: l.qty,
      originalPrice: l.product.price,
      unitPrice: l.unitPrice,
    })),
    totals: {
      itemCount: totals.itemCount,
      originalTotal: totals.originalTotal,
      discountTotal: totals.discountTotal,
      subtotal: totals.subtotal,
      shippingCost,
      total: totals.subtotal + shippingCost,
    },
    // نمایشی: درگاه واقعی وجود ندارد
    payment: {
      status: 'paid',
      method: 'پرداخت آنلاین',
      refId: randomDigits(12),
      paidAt: now.toISOString(),
    },
    note: note.trim(),
  };

  if (!writeStore('orders', [order, ...orders])) {
    throw new Error('ذخیره‌ی سفارش ممکن نشد (حافظه‌ی مرورگر پر یا مسدود است).');
  }
  return order;
}