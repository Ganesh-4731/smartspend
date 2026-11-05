import { AlertCircle } from 'lucide-react';
export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-coral-100 bg-coral-50 px-4 py-10 text-center dark:border-coral-500/20 dark:bg-coral-500/10">
      <AlertCircle className="text-coral-600" size={28} aria-hidden="true" />
      <p className="max-w-md text-sm text-coral-700 dark:text-coral-400">{message}</p>
      {onRetry && <button type="button" className="btn-secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}
