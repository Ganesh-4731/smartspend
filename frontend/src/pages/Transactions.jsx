import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftRight, Download, Plus, Search } from 'lucide-react';
import useAsync from '../hooks/useAsync.js';
import useDebounce from '../hooks/useDebounce.js';
import useFormat from '../hooks/useFormat.js';
import { transactionApi } from '../api/index.js';
import { getErrorMessage } from '../api/client.js';
import { downloadBlob } from '../utils/csv.js';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants.js';
import Modal from '../components/common/Modal.jsx';
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import TransactionTable from '../components/transactions/TransactionTable.jsx';

const LIMIT = 10;
const SORTS = {
  'date:desc': 'Newest first', 'date:asc': 'Oldest first', 'amount:desc': 'Highest amount', 'amount:asc': 'Lowest amount',
};
const EMPTY = { type: '', category: '', from: '', to: '', minAmount: '', maxAmount: '', sortKey: 'date:desc' };

export default function Transactions() {
  const { money } = useFormat();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(EMPTY);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | transaction
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (searchParams.get('new')) { setEditing('new'); setSearchParams({}, { replace: true }); }
  }, [searchParams, setSearchParams]);

  const query = useMemo(() => {
    const [sort, order] = filters.sortKey.split(':');
    const q = { search, type: filters.type, category: filters.category, from: filters.from, to: filters.to, minAmount: filters.minAmount, maxAmount: filters.maxAmount, sort, order };
    return Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined));
  }, [filters, search]);
  const key = JSON.stringify(query);
  const rangeInvalid = query.from && query.to && query.from > query.to;
  const { data, loading, error, reload } = useAsync(
    () => (rangeInvalid ? Promise.resolve(null) : transactionApi.list({ ...query, page, limit: LIMIT })), [key, page, rangeInvalid]);

  const setFilter = (name, value) => { setFilters((f) => ({ ...f, [name]: value, ...(name === 'type' ? { category: '' } : {}) })); setPage(1); };
  useEffect(() => { setPage(1); }, [search]);
  const reset = () => { setFilters(EMPTY); setSearchInput(''); setPage(1); };
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY) || searchInput !== '';

  const items = data?.data || [];
  const meta = data?.meta;
  const categories = filters.type === 'income' ? INCOME_CATEGORIES : filters.type === 'expense' ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  const save = useCallback(async (payload) => {
    if (editing && editing !== 'new') await transactionApi.update(editing.id, payload);
    else await transactionApi.create(payload);
    toast.success(editing === 'new' ? 'Transaction added' : 'Transaction updated');
    setEditing(null);
    reload();
  }, [editing, reload]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await transactionApi.remove(deleting.id);
      toast.success('Transaction deleted');
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage(page - 1); else reload();
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await transactionApi.exportCsv(query);
      downloadBlob(res.data, 'transactions.csv');
      toast.success('Export started');
    } catch (e) { toast.error(getErrorMessage(e, 'Export failed')); } finally { setExporting(false); }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="page-title">Transactions</h1><p className="text-sm text-slate-500 dark:text-slate-400">Search, filter and manage all your income and expenses.</p></div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={exportCsv} disabled={exporting || !meta?.total}><Download size={16} />{exporting ? 'Exporting…' : 'Export CSV'}</button>
          <button type="button" className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} />Add transaction</button>
        </div>
      </div>

      <section className="card mb-4" aria-label="Filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <label htmlFor="tx-search" className="label">Search</label>
            <Search size={16} className="pointer-events-none absolute bottom-3 left-3 text-slate-400" aria-hidden="true" />
            <input id="tx-search" type="search" className="input pl-9" placeholder="Search title or notes…" value={searchInput} maxLength={100} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <div><label htmlFor="f-type" className="label">Type</label>
            <select id="f-type" className="input" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select></div>
          <div><label htmlFor="f-cat" className="label">Category</label>
            <select id="f-cat" className="input" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="f-from" className="label">From</label><input id="f-from" type="date" className="input" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} /></div>
          <div><label htmlFor="f-to" className="label">To</label><input id="f-to" type="date" className="input" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label htmlFor="f-min" className="label">Min amount</label><input id="f-min" type="number" min="0" step="0.01" inputMode="decimal" className="input" value={filters.minAmount} onChange={(e) => setFilter('minAmount', e.target.value)} /></div>
            <div><label htmlFor="f-max" className="label">Max amount</label><input id="f-max" type="number" min="0" step="0.01" inputMode="decimal" className="input" value={filters.maxAmount} onChange={(e) => setFilter('maxAmount', e.target.value)} /></div>
          </div>
          <div><label htmlFor="f-sort" className="label">Sort by</label>
            <select id="f-sort" className="input" value={filters.sortKey} onChange={(e) => setFilter('sortKey', e.target.value)}>{Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        </div>
        {rangeInvalid && <p role="alert" className="mt-3 text-sm text-coral-600">The "To" date must not be before the "From" date.</p>}
        {hasFilters && <div className="mt-3"><button type="button" className="btn-ghost" onClick={reset}>Clear filters</button></div>}
      </section>

      <section className="card !p-0">
        {meta && meta.total > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-slate-200 px-4 py-3 text-sm dark:border-navy-800">
            <span className="text-slate-500">Matching: <b className="text-navy-900 dark:text-white">{meta.total}</b></span>
            <span className="text-slate-500">Income: <b className="text-emerald-600">{money(meta.totals.income)}</b></span>
            <span className="text-slate-500">Expenses: <b className="text-coral-600">{money(meta.totals.expense)}</b></span>
          </div>
        )}
        {loading && !data ? <LoadingSpinner label="Loading transactions…" />
          : error ? <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>
          : items.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title={hasFilters ? 'No matching transactions' : 'No transactions yet'}
              message={hasFilters ? 'Try changing or clearing your filters.' : 'Record your first income or expense to get started.'}
              action={hasFilters ? <button type="button" className="btn-secondary" onClick={reset}>Clear filters</button> : <button type="button" className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} />Add transaction</button>} />
          ) : (
            <div className={loading ? 'opacity-60 transition-opacity' : ''}>
              <TransactionTable items={items} onEdit={setEditing} onDelete={setDeleting} />
              <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
            </div>
          )}
      </section>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add transaction' : 'Edit transaction'}>
        {editing && <TransactionForm initial={editing === 'new' ? null : editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmationDialog open={!!deleting} title="Delete transaction?" loading={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete}
        message={deleting ? `"${deleting.title}" will be permanently deleted and your totals will update. This cannot be undone.` : ''} />
    </div>
  );
}
