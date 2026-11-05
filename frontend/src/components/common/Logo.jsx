export default function Logo({ compact = false, light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 8.5C16.5 7 14.5 6 12 6s-4.5 1-4.5 2.7 2 2.3 4.5 3 4.5 1.3 4.5 3S14.5 18 12 18s-4.5-1-4.5-2.5" /><path d="M12 3v18" /></svg>
      </span>
      {!compact && <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-navy-900 dark:text-white'}`}>Smart<span className="text-emerald-500">Spend</span></span>}
    </span>
  );
}
