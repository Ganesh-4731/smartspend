import { Pencil, Trash2 } from 'lucide-react';
import useFormat from '../../hooks/useFormat.js';

export default function TransactionTable({ items, onEdit, onDelete, compact = false }) {
  const { money, date } = useFormat();
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${compact ? 'min-w-[560px]' : 'min-w-[760px]'}`}>
        <thead className="border-b border-slate-200 dark:border-navy-800">
          <tr>
            <th scope="col" className="th">Date</th>
            <th scope="col" className="th">Description</th>
            <th scope="col" className="th">Category</th>
            <th scope="col" className="th">Type</th>
            {!compact && <th scope="col" className="th">Method</th>}
            <th scope="col" className="th text-right">Amount</th>
            {!compact && <th scope="col" className="th text-right"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
          {items.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50">
              <td className="td whitespace-nowrap text-slate-600 dark:text-slate-300">{date(t.date)}</td>
              <td className="td max-w-[16rem]">
                <p className="truncate font-medium text-navy-900 dark:text-white" title={t.title}>{t.title}</p>
                {!compact && t.tags?.length > 0 && <p className="mt-0.5 truncate text-xs text-slate-500">{t.tags.map((x) => `#${x}`).join(' ')}</p>}
              </td>
              <td className="td whitespace-nowrap"><span className="badge-neutral">{t.category}</span></td>
              <td className="td"><span className={t.type === 'income' ? 'badge-income' : 'badge-expense'}>{t.type}</span></td>
              {!compact && <td className="td whitespace-nowrap text-slate-600 dark:text-slate-300">{t.paymentMethod}</td>}
              <td className={`td whitespace-nowrap text-right font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-coral-600 dark:text-coral-400'}`}>
                {t.type === 'income' ? '+' : '−'}{money(t.amount)}
              </td>
              {!compact && (
                <td className="td whitespace-nowrap text-right">
                  <button type="button" className="btn-icon h-9 w-9" onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`}><Pencil size={16} /></button>
                  <button type="button" className="btn-icon h-9 w-9 hover:text-coral-600" onClick={() => onDelete(t)} aria-label={`Delete ${t.title}`}><Trash2 size={16} /></button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
