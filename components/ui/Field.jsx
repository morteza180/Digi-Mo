/**
 * برچسب + کنترل فرم + پیام خطا یا راهنما.
 * کنترل داخل children باید id برابر `id` و در صورت خطا aria-describedby برابر `${id}-err` داشته باشد.
 */
export default function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-anar">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
