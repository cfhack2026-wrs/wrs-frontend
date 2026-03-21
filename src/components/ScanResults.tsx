import type { Assessment, Scan } from '../types/scanner';
import { CategoryCard } from './CategoryCard';
import { ScoreRing } from './ScoreRing';

function downloadResults(scan: Scan) {
  const data = JSON.stringify({
    website: scan.url,
    scanUrl: scan.monitor,
    status: scan.status,
    assessments: scan.assessments,
  }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scan-results-${new URL(scan.url).hostname}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function shareUrl(scan: Scan) {
  const url = scan.monitor
  const shareData = {
    title: `Scan Results for ${new URL(scan.url).hostname}`,
    text: `Check out the scan results for ${scan.url}`,
    url,
  };
  if (navigator.share && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
  } else {
    await navigator.clipboard.writeText(`${window.location.host}/#/scan/${scan.id}`);
  }
}

interface ScanResultsProps {
  scan: Scan;
  isScanning?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  accessibility: 'Accessibility',
  sustainability: 'Sustainability',
};

function formatLabel(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function FindingsSection({ name, assessments }: { name: string; assessments: Assessment[] }) {
  const relevant = assessments.filter((a) => a.status !== 'skipped');
  const passed = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed');
  const allFindings = relevant
    .filter((a) => a.findings.length > 0 || a.status === 'failed')
    .flatMap((a) => a.findings);

  return (
    <section aria-label={`${name} findings`} className="space-y-4">
      <h2
        className="mono text-xs uppercase tracking-widest"
        style={{ color: 'var(--text-dim)', letterSpacing: '0.12em' }}
      >
        {name}
      </h2>

      {allFindings.length > 0 && (
        <div className="space-y-2">
          <h3
            className="mono text-xs uppercase tracking-widest"
            style={{ color: 'rgba(248,113,113,0.7)', letterSpacing: '0.1em' }}
          >
            Issues
          </h3>
          <ul className="space-y-2">
            {allFindings.map((f) => {
              const title = typeof f.details.title === 'string' ? f.details.title : formatLabel(f.identifier);
              const suggestion = typeof f.details.suggestion === 'string' ? f.details.suggestion : undefined;
              const affected = typeof f.details.affected === 'string' ? f.details.affected : undefined;
              return (
                <li
                  key={f.id}
                  className="rounded-xl p-4 space-y-1.5"
                  style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                      stroke="rgba(248,113,113,0.8)" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{title}</span>
                      {affected && (
                        <span className="mono ml-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                          {affected}
                        </span>
                      )}
                    </div>
                  </div>
                  {suggestion && (
                    <p className="text-xs leading-relaxed pl-6" style={{ color: 'var(--text-muted)' }}>
                      {suggestion}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {passed.length > 0 && (
        <div className="space-y-2">
          <h3
            className="mono text-xs uppercase tracking-widest"
            style={{ color: 'rgba(74,222,128,0.6)', letterSpacing: '0.1em' }}
          >
            Passed
          </h3>
          <ul className="space-y-1.5">
            {passed.map((a) => {
              const message = typeof a.details?.message === 'string' ? a.details.message : undefined;
              return (
                <li key={a.id} className="flex items-start gap-2.5 text-sm">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                    stroke="rgba(74,222,128,0.7)" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>{formatLabel(a.identifier)}</span>
                    {message && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{message}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function SkeletonCard() {
  return (
    <article
      aria-hidden="true"
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{
        background: 'var(--navy-card)',
        border: '1px solid var(--border)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div className="w-[88px] h-[88px] rounded-full shrink-0"
        style={{ background: 'rgba(34,211,238,0.06)' }} />
      <div className="space-y-2 flex-1">
        <div className="h-3 w-24 rounded" style={{ background: 'rgba(34,211,238,0.06)' }} />
        <div className="h-2.5 w-16 rounded" style={{ background: 'rgba(34,211,238,0.04)' }} />
      </div>
    </article>
  );
}

export function ScanResults({ scan, isScanning = false }: ScanResultsProps) {
  const categoryMap = new Map<string, typeof scan.assessments>();
  for (const a of scan.assessments) {
    const key = a.category ?? '__other__';
    if (!categoryMap.has(key)) categoryMap.set(key, []);
    categoryMap.get(key)!.push(a);
  }

  const relevant = scan.assessments.filter((a) => a.status !== 'skipped');
  const passedCount = relevant.filter(
    (a) => a.findings.length === 0 && a.status === 'completed',
  ).length;
  const overallScore =
    relevant.length > 0 ? Math.round((passedCount / relevant.length) * 100) : 100;

  const categorized = [...categoryMap.entries()].filter(([k]) => k !== '__other__');
  const other = categoryMap.get('__other__') ?? [];
  const allCategories: [string, typeof scan.assessments][] = [
    ...categorized,
    ...(other.length > 0 ? [['__other__', other] as [string, typeof scan.assessments]] : []),
  ];

  const scoreColor = overallScore >= 90 ? '#4ade80' : overallScore >= 50 ? '#fbbf24' : '#f87171';

  return (
    <section className="w-full max-w-4xl space-y-5 animate-fade-up" aria-label="Scan results">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">{scan.url}</p>
        <div className="flex items-center gap-2">
          <button
              onClick={() => downloadResults(scan)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
              onClick={() => shareUrl(scan)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* URL breadcrumb */}
      <p className="mono text-xs break-all" style={{ color: 'var(--text-dim)' }}>
        {scan.url}
      </p>

      {/* Overall score */}
      <div
        className="rounded-2xl p-6 flex items-center gap-6"
        style={{ background: 'var(--navy-card)', border: '1px solid var(--border)' }}
      >
        <ScoreRing score={overallScore} size={104} />
        <div>
          <p
            className="mono text-xs uppercase tracking-widest mb-1.5"
            style={{ color: 'var(--text-dim)', letterSpacing: '0.12em' }}
          >
            Overall Score
          </p>
          <p className="text-2xl font-semibold" style={{ color: scoreColor }}>
            {overallScore}
            <span className="text-base font-normal ml-1" style={{ color: 'var(--text-dim)' }}>/100</span>
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isScanning
              ? 'Scan in progress — results updating…'
              : overallScore >= 90
                ? 'Excellent — this site is in great shape.'
                : overallScore >= 50
                  ? 'Some issues found — room for improvement.'
                  : 'Critical issues detected — action recommended.'}
          </p>
        </div>
      </div>

      {/* Per-category cards */}
      {allCategories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {allCategories.map(([catId, assessments]) => (
            <div key={catId} className="card-enter">
              <CategoryCard
                id={catId}
                name={catId === '__other__' ? 'Other' : (CATEGORY_LABELS[catId] ?? formatLabel(catId))}
                assessments={assessments}
              />
            </div>
          ))}
          {isScanning && <><SkeletonCard /><SkeletonCard /></>}
        </div>
      )}

      {/* Findings */}
      {allCategories.length > 0 && (
        <div
          className="rounded-2xl p-6 space-y-8"
          style={{ background: 'var(--navy-card)', border: '1px solid var(--border)' }}
        >
          {allCategories.map(([catId, assessments]) => (
            <FindingsSection
              key={catId}
              name={catId === '__other__' ? 'Other' : (CATEGORY_LABELS[catId] ?? formatLabel(catId))}
              assessments={assessments}
            />
          ))}
        </div>
      )}
    </section>
  );
}
