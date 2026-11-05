import { Sparkles } from 'lucide-react';
import useAsync from '../hooks/useAsync.js';
import useDateRange from '../hooks/useDateRange.js';
import { insightApi } from '../api/index.js';
import DateRangeFilter from '../components/common/DateRangeFilter.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import InsightCard from '../components/insights/InsightCard.jsx';
import { Link } from 'react-router-dom';
import useFormat from '../hooks/useFormat.js';

export default function Insights() {
  const range = useDateRange('thisMonth');
  const { date } = useFormat();
  const { data, loading, error, reload } = useAsync(() => (range.valid ? insightApi.get(range.params) : Promise.resolve(null)), [range.params.from, range.params.to, range.valid]);
  const d = data?.data;
  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="page-title">Smart insights</h1><p className="text-sm text-slate-500 dark:text-slate-400">Rule-based observations from your own transactions — no external AI involved.</p></div>
        <DateRangeFilter value={range.value} onPresetChange={range.onPresetChange} onCustomChange={range.onCustomChange} />
      </div>
      {!range.valid ? <ErrorState message="Choose a valid date range." />
        : loading && !d ? <LoadingSpinner label="Analysing your transactions…" />
        : error && !d ? <ErrorState message={error} onRetry={reload} />
        : d && (
          <div className={loading ? 'opacity-70' : ''}>
            <p className="mb-4 text-xs text-slate-500">Analysing {date(d.period.from)} – {date(d.period.to)} · compared with {date(d.period.previous.from)} – {date(d.period.previous.to)}</p>
            {!d.hasData ? (
              <div className="card"><EmptyState icon={Sparkles} title="Not enough data yet" message={d.insights[0].message}
                action={<Link to="/transactions?new=1" className="btn-primary">Add a transaction</Link>} /></div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">{d.insights.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
            )}
            <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600 dark:bg-navy-800 dark:text-slate-300">{d.disclaimer}</p>
          </div>
        )}
    </div>
  );
}
