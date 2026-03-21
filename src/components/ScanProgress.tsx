import type { Scan } from '../types/scanner';

interface ScanProgressProps {
  scan: Scan;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'queued',
  running: 'scanning…',
  completed: 'complete',
  completed_with_errors: 'completed with errors',
  failed: 'failed',
};

export function ScanProgress({ scan }: ScanProgressProps) {
  const isTerminal = ['completed', 'completed_with_errors', 'failed'].includes(scan.status);

  return (
    <div
      className="w-full max-w-2xl animate-fade-up"
      role="status"
      aria-live="polite"
    >
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--navy-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <span
            className="mono text-xs truncate"
            style={{ color: 'var(--text-dim)' }}
          >
            {scan.url}
          </span>
          <span
            className="mono text-xs shrink-0 font-medium"
            style={{
              color:
                scan.status === 'completed'             ? 'var(--score-good)' :
                scan.status === 'failed'                ? 'var(--error-text)' :
                scan.status === 'completed_with_errors' ? 'var(--score-ok)' :
                'var(--accent-text)',
            }}
          >
            {STATUS_LABEL[scan.status] ?? scan.status}
          </span>
        </div>

        {!isTerminal && (
          <div
            className="h-px w-full overflow-hidden relative"
            style={{ background: 'rgba(34,211,238,0.1)' }}
          >
            <div
              className="scan-sweep absolute inset-y-0 w-1/4"
              style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
