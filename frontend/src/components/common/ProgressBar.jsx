const COLORS = { ok: 'bg-emerald-500', warning: 'bg-amber-500', exceeded: 'bg-coral-500', none: 'bg-slate-300' };
export default function ProgressBar({ percent = 0, status = 'ok', label, height = 'h-2.5' }) {
  const width = Math.max(0, Math.min(percent ?? 0, 100));
  return (
    <div role="progressbar" aria-valuenow={Math.round(percent ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800 ${height}`}>
      <div className={`${height} rounded-full transition-all duration-500 ${COLORS[status] || COLORS.ok}`} style={{ width: `${width}%` }} />
    </div>
  );
}
