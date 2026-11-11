import { ORDER_STEPS } from '@/lib/constants';
import { formatNumber } from '@/lib/format';

export default function OrderTimeline({ status = 'processing' }) {
  if (status === 'canceled') {
    return <p className="rounded-xl bg-red-50 p-3 text-sm text-anar">این سفارش لغو شده است.</p>;
  }

  const current = Math.max(0, ORDER_STEPS.findIndex((s) => s.key === status));

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="مراحل سفارش">
      {ORDER_STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s.key}
            className="flex flex-col items-center gap-2 text-center"
            aria-current={active ? 'step' : undefined}
          >
            <span className={`h-1.5 w-full rounded-full ${i <= current ? 'bg-firouzeh' : 'bg-slate-200'}`} />
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                done
                  ? 'bg-firouzeh text-white'
                  : active
                    ? 'bg-zaferan text-slate-900 ring-4 ring-zaferan/30'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? '✓' : formatNumber(i + 1)}
            </span>
            <span className={`text-xs ${i <= current ? 'font-medium text-slate-800' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}