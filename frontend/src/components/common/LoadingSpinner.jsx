export default function LoadingSpinner({ label = 'Loading…', className = '' }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400 ${className}`}>
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/25 border-t-emerald-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
