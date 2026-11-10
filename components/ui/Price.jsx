import { calcFinalPrice, formatPrice, formatNumber } from '@/lib/format';

export default function Price({ price, discount = 0, large = false }) {
  const final = calcFinalPrice(price, discount);
  return (
    <div className="flex flex-col gap-0.5">
      {discount > 0 && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-anar px-2 py-0.5 text-xs font-bold text-white">
            {formatNumber(discount)}٪
          </span>
          <span className="text-xs text-slate-400 line-through">{formatPrice(price)}</span>
        </div>
      )}
      <span className={`font-bold text-lajevard ${large ? 'text-2xl' : 'text-base'}`}>
        {formatPrice(final)}
      </span>
    </div>
  );
}