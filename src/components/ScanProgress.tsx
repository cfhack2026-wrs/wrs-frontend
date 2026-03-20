import type { Scan } from '../types/scanner';

interface ScanProgressProps {
  scan: Scan;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Queued',
  running: 'Scanning…',
  completed: 'Complete',
  completed_with_errors: 'Completed with errors',
  failed: 'Failed',
};

export function ScanProgress({ scan }: ScanProgressProps) {
  const isTerminal = ['completed', 'completed_with_errors', 'failed'].includes(scan.status);

  return (
    <div className="w-full max-w-2xl" role="status" aria-live="polite">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          {scan.url}
        </span>
        <span
          className={`text-sm font-medium ${
            scan.status === 'completed'
              ? 'text-green-400'
              : scan.status === 'failed'
              ? 'text-red-400'
              : scan.status === 'completed_with_errors'
              ? 'text-yellow-400'
              : 'text-indigo-400'
          }`}
        >
          {STATUS_LABEL[scan.status] ?? scan.status}
        </span>
      </div>

      {!isTerminal && (
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-pulse w-full" />
        </div>
      )}
    </div>
  );
}
