import type { Assessment, Scan } from '../types/scanner';
import { CategoryCard, categoryScore } from './CategoryCard';
import { ScoreRing } from './ScoreRing';

interface ScanResultsProps {
  scan: Scan;
}

const CATEGORY_LABELS: Record<string, string> = {
  accessibility: 'Accessibility',
  sustainability: 'Sustainability',
};

function formatLabel(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractFixSuggestion(details: Record<string, unknown>): string | undefined {
  const v = details.suggestion ?? details.message;
  return typeof v === 'string' ? v : undefined;
}

function FindingsSection({ name, assessments }: { name: string; assessments: Assessment[] }) {
  const relevant = assessments.filter((a) => a.status !== 'skipped');
  const violations = relevant.filter((a) => a.findings.length > 0 || a.status === 'failed');
  const passed = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed');

  return (
    <section aria-label={`${name} findings`} className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{name}</h2>

      {violations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-red-500 font-semibold">Issues</h3>
          <ul className="space-y-2">
            {violations.map((a) => {
              const fixSuggestion =
                a.findings.length > 0 ? extractFixSuggestion(a.findings[0].details) : undefined;
              return (
                <li
                  key={a.id}
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {formatLabel(a.identifier)}
                    </span>
                  </div>
                  {fixSuggestion && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-6">
                      {fixSuggestion}
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
          <ul className="space-y-1.5">
            {passed.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <svg
                  className="w-4 h-4 shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">{formatLabel(a.identifier)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ScanResults({ scan }: ScanResultsProps) {
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
      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">{scan.url}</p>

      {/* Row 1 — Overall score */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 flex items-center gap-6">
        <ScoreRing score={overallScore} size={104} />
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">
            Overall Score
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {overallScore >= 90
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
            <CategoryCard
              key={catId}
              id={catId}
              name={catId === '__other__' ? 'Other' : (CATEGORY_LABELS[catId] ?? formatLabel(catId))}
              assessments={assessments}
            />
          ))}
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
