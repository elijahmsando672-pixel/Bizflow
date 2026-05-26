import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-slate-600 mb-4 text-center">{message || 'Failed to load data'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  icon,
}: {
  message?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon}
      <p className="text-slate-400 text-center mt-3">{message || 'No data available'}</p>
    </div>
  );
}
