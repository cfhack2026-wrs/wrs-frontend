import type { Assessment, Scan } from '../types/scanner';
import { CategoryCard } from './CategoryCard';
import { ScoreRing } from './ScoreRing';

function downloadResults(scan: Scan) {
  const data = JSON.stringify({
    id: scan.id,
    url: scan.monitor,
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

  // Flatten all findings across violating assessments for per-check display
  const allFindings = relevant
    .filter((a) => a.findings.length > 0 || a.status === 'failed')
    .flatMap((a) => a.findings);

  return (
    <section aria-label={`${name} findings`} className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{name}</h2>

      {allFindings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-red-500 font-semibold">Issues</h3>
          <ul className="space-y-2">
            {allFindings.map((f) => {
              const title = typeof f.details.title === 'string' ? f.details.title : formatLabel(f.identifier);
              const suggestion = typeof f.details.suggestion === 'string' ? f.details.suggestion : undefined;
              const affected = typeof f.details.affected === 'string' ? f.details.affected : undefined;
              return (
                <li
                  key={f.id}
                  className="rounded-xl bg-red-500/5 border border-red-500/15 p-3 space-y-1.5"
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 shrink-0 mt-0.5 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</span>
                      {affected && (
                        <span className="ml-2 text-xs text-gray-400">{affected}</span>
                      )}
                    </div>
                  </div>
                  {suggestion && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-6">
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
          <h3 className="text-xs uppercase tracking-widest text-green-600 dark:text-green-500 font-semibold">
            Passed
          </h3>
          <ul className="space-y-2">
            {passed.map((a) => {
              const message = typeof a.details?.message === 'string' ? a.details.message : undefined;
              return (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <svg
                    className="w-4 h-4 shrink-0 mt-0.5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">{formatLabel(a.identifier)}</span>
                    {message && (
                      <p className="text-xs text-gray-400 mt-0.5">{message}</p>
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
      className="rounded-2xl border border-gray-200 dark:border-white/10
                 bg-white dark:bg-white/5 p-5 flex items-center gap-4 animate-pulse"
    >
      <div className="w-[88px] h-[88px] rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-3 w-16 rounded bg-gray-100 dark:bg-white/5" />
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

  return (
    <section className="w-full max-w-4xl space-y-6" aria-label="Scan results">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">{scan.url}</p>
        <button
          onClick={() => downloadResults(scan)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>

      {/* Row 1 — Overall score */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 flex items-center gap-6">
        <ScoreRing score={overallScore} size={104} />
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">
            Overall Score
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {isScanning
              ? 'Scan in progress — results updating…'
              : overallScore >= 90
                ? 'Excellent — this site is in great shape.'
                : overallScore >= 50
                  ? 'Some issues found — there is room for improvement.'
                  : 'Critical issues detected — action recommended.'}
          </p>
        </div>
      </div>

      {/* Row 2 — Per-category score cards */}
      {allCategories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allCategories.map(([catId, assessments]) => (
            <div key={catId} className="card-enter">
              <CategoryCard
                id={catId}
                name={catId === '__other__' ? 'Other' : (CATEGORY_LABELS[catId] ?? formatLabel(catId))}
                assessments={assessments}
              />
            </div>
          ))}
          {isScanning && (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>
      )}

      {/* Findings sections — one per category */}
      {allCategories.length > 0 && (
        <div className="space-y-8 pt-2">
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
