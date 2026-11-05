import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function Pagination({ page, totalPages, total, limit, onChange }) {
  if (!total) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row dark:border-navy-800">
      <p className="text-slate-500 dark:text-slate-400">Showing {start}–{end} of {total}</p>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary px-3" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
        <span className="min-w-[5rem] text-center text-slate-600 dark:text-slate-300">Page {page} / {totalPages}</span>
        <button type="button" className="btn-secondary px-3" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
