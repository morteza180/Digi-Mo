import { calcFinalPrice } from '@/lib/format';
import { MAX_QTY } from '@/lib/constants';

/**
 * status:
 *  ok       → قابل خرید
 *  missing  → کالا دیگر وجود ندارد (ادمین حذف کرده)
 *  out      → ناموجود
 *  limited  → تعداد سبد بیشتر از موجودی
 * قیمت هیچ‌وقت داخل سبد ذخیره نمیشه؛ همیشه از داده‌ی محصول محاسبه میشه.
 */
export function resolveLines(items, products) {
  const map = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = map.get(item.id) ?? null;
    let status = 'ok';
    if (!product) status = 'missing';
    else if (product.stock <= 0) status = 'out';
    else if (item.qty > product.stock) status = 'limited';

    const unitPrice = product ? calcFinalPrice(product.price, product.discount) : 0;

    return {
      ...item,
      key: `${item.id}::${item.color ?? ''}`,
      product,
      status,
      unitPrice,
      lineTotal: unitPrice * item.qty,
      maxQty: product ? Math.max(0, Math.min(MAX_QTY, product.stock)) : 0,
    };
  });
}

export function calcTotals(lines, settings) {
  const valid = lines.filter((l) => l.status === 'ok');

  const originalTotal = valid.reduce((s, l) => s + l.product.price * l.qty, 0);
  const subtotal = valid.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = valid.reduce((s, l) => s + l.qty, 0);

  const { freeShippingThreshold, methods } = settings.shipping;
  const cheapestShipping = Math.min(...methods.map((m) => m.cost));

  return {
    itemCount,
    originalTotal,
    subtotal,
    discountTotal: originalTotal - subtotal,
    freeShipping: subtotal > 0 && subtotal >= freeShippingThreshold,
    remainingForFree: Math.max(0, freeShippingThreshold - subtotal),
    freeProgress: Math.min(100, (subtotal / freeShippingThreshold) * 100),
    cheapestShipping,
  };
}