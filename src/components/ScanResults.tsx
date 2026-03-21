import type { Assessment, Scan } from '../types/scanner';
import { CategoryCard } from './CategoryCard';
import { ScoreRing } from './ScoreRing';

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
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-red-500 font-semibold">Issues</h3>
          <ul className="space-y-3">
            {allFindings.map((f, i) => {
              const title = typeof f.details.title === 'string' ? f.details.title : formatLabel(f.identifier);
              const description = typeof f.details.description === 'string' ? f.details.description : undefined;
              const suggestion = typeof f.details.suggestion === 'string' ? f.details.suggestion : undefined;
              const affected = typeof f.details.affected === 'string' ? f.details.affected : undefined;
              
              const impact = typeof f.details.impact === 'string' ? f.details.impact : undefined;
              const helpUrl = typeof f.details.help_url === 'string' ? f.details.help_url : undefined;
              const tags = Array.isArray(f.details.tags) ? (f.details.tags as string[]) : [];
              const nodes = Array.isArray(f.details.nodes) ? (f.details.nodes as { html?: string, failure_summary?: string }[]) : [];

              return (
                <li
                  key={`${f.id}-${i}`}
                  className="rounded-xl bg-red-500/5 border border-red-500/15 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</span>
                        {impact && (
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${
                            impact === 'critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                            impact === 'serious' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {impact}
                          </span>
                        )}
                        {affected && (
                          <span className="text-xs text-gray-500">Affected: {affected}</span>
                        )}
                      </div>
                      
                      {description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {description}
                          {helpUrl && (
                            <a href={helpUrl} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                              Learn more
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          )}
                        </p>
                      )}
                      
                      {suggestion && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {suggestion}
                        </p>
                      )}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {nodes.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {nodes.slice(0, 3).map((node, idx) => (
                            <div key={idx} className="rounded-md border border-red-500/10 bg-red-500/5 p-3 text-sm">
                              {node.html && (
                                <code className="block mb-2 text-xs text-red-600 dark:text-red-300 font-mono break-all whitespace-pre-wrap">
                                  {node.html}
                                </code>
                              )}
                              {node.failure_summary && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono relative pl-3 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-red-500/30">
                                  {node.failure_summary}
                                </p>
                              )}
                            </div>
                          ))}
                          {nodes.length > 3 && (
                            <p className="text-xs text-gray-500 italic">+ {nodes.length - 3} more affected elements</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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
              const hostedBy = typeof a.details?.hosted_by === 'string' ? a.details.hosted_by : undefined;
              
              return (
                <li key={a.id} className="flex items-start gap-2 text-sm bg-green-500/5 border border-green-500/10 rounded-lg p-3">
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{formatLabel(a.identifier)}</span>
                      {hostedBy && (
                        <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                          Hosted by {hostedBy}
                        </span>
                      )}
                    </div>
                    {message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
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
      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">{scan.url}</p>

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
