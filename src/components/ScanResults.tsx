import { useState } from 'react';
import type { Assessment, Scan } from '../types/scanner';
import { ScoreRing } from './ScoreRing';

function categoryScore(assessments: Assessment[]): { score: number; passed: number; total: number } {
  const relevant = assessments.filter((a) => a.status !== 'skipped');
  const passed = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed').length;
  const score = relevant.length > 0 ? Math.round((passed / relevant.length) * 100) : 100;
  return { score, passed, total: relevant.length };
}

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
  const url = scan.monitor;
  const shareData = {
    title: `Scan Results for ${new URL(scan.url).hostname}`,
    text: `Check out the scan results for ${scan.url}`,
    url,
  };
  if (navigator.share && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
  } else {
    let base = "https://cfhack2026-wrs.github.io/wrs-frontend"
    if (window.location.host === 'localhost') {
      base = "http://localhost:3000"
    }
    await navigator.clipboard.writeText(`${base}/#/scan/${scan.id}`);
  }
}

interface ScanResultsProps {
  scan: Scan;
  isScanning?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  accessibility: 'Accessibility',
  sustainability: 'Sustainability',
  performance:   'Performance',
  seo:           'SEO',
  security:      'Security',
};

// Decorative accent colors per category (borders, icons, glows — not used as text)
const CATEGORY_COLORS: Record<string, string> = {
  accessibility: '#22d3ee',
  sustainability: '#4ade80',
  performance:   '#facc15',
  seo:           '#a78bfa',
  security:      '#f97316',
  __other__:     '#94a3b8',
};

function formatLabel(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(catId: string): string {
  return catId === '__other__' ? 'Other' : (CATEGORY_LABELS[catId] ?? formatLabel(catId));
}

function CategoryIcon({ id, size = 16, color }: { id: string; size?: number; color: string }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  switch (id) {
    case 'accessibility':
      return (
        <svg {...p}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 22V12" />
          <path d="M5 8h14" />
          <path d="M7 22l5-10 5 10" />
        </svg>
      );
    case 'sustainability':
      return (
        <svg {...p}>
          <path d="M12 22V12" />
          <path d="M5 12c0-3.866 3.134-7 7-7s7 3.134 7 7" />
          <path d="M5 12c3.866 0 7-3.134 7-7" />
        </svg>
      );
    case 'performance':
      return (
        <svg {...p}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'seo':
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case 'security':
      return (
        <svg {...p}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
  }
}

function FindingsSection({ name, assessments }: { name: string; assessments: Assessment[] }) {
  const relevant = assessments.filter((a) => a.status !== 'skipped');
  const passed = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed');
  const allFindings = relevant
    .filter((a) => a.findings.length > 0 || a.status === 'failed')
    .flatMap((a) => a.findings);

  if (allFindings.length === 0 && passed.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        No checks ran for this category.
      </p>
    );
  }

  return (
    <div className="space-y-6" aria-label={`${name} findings`}>
      {allFindings.length > 0 && (
        <div className="space-y-3">
          <h3
            className="mono text-xs uppercase tracking-widest"
            style={{ color: 'var(--error-text)', letterSpacing: '0.1em' }}
          >
            Issues · {allFindings.length}
          </h3>
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
                  className="rounded-xl p-4 space-y-3 bg-red-500/5 border border-red-500/15"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 mt-0.5"
                      fill="none" viewBox="0 0 24 24"
                      stroke="var(--error-text)" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
          <h3
            className="mono text-xs uppercase tracking-widest"
            style={{ color: 'var(--success-text)', letterSpacing: '0.1em' }}
          >
            Passed · {passed.length}
          </h3>
          <ul className="space-y-1.5">
            {passed.map((a) => {
              const message = typeof a.details?.message === 'string' ? a.details.message : undefined;
              const hostedBy = typeof a.details?.hosted_by === 'string' ? a.details.hosted_by : undefined;
              
              return (
                <li key={a.id} className="flex items-start gap-2 text-sm bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                    stroke="var(--success-text)" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
    </div>
  );
}

function SkeletonTab() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl flex-1 min-w-[130px] h-[76px]"
      style={{ background: 'var(--navy-card)', border: '1px solid var(--border)' }}
    />
  );
}

export function ScanResults({ scan, isScanning = false }: ScanResultsProps) {
  const categoryMap = new Map<string, typeof scan.assessments>();
  for (const a of scan.assessments) {
    const key = a.category ?? '__other__';
    if (!categoryMap.has(key)) categoryMap.set(key, []);
    categoryMap.get(key)!.push(a);
  }

  const categorized = [...categoryMap.entries()].filter(([k]) => k !== '__other__');
  const other = categoryMap.get('__other__') ?? [];
  const allCategories: [string, typeof scan.assessments][] = [
    ...categorized,
    ...(other.length > 0 ? [['__other__', other] as [string, typeof scan.assessments]] : []),
  ];

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const effectiveTab =
    activeTab && allCategories.some(([id]) => id === activeTab)
      ? activeTab
      : (allCategories[0]?.[0] ?? null);

  const relevant = scan.assessments.filter((a) => a.status !== 'skipped');
  const passedCount = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed').length;
  const overallScore = relevant.length > 0 ? Math.round((passedCount / relevant.length) * 100) : 100;
  const scoreColor = overallScore >= 90 ? 'var(--score-good)' : overallScore >= 50 ? 'var(--score-ok)' : 'var(--score-bad)';

  const activeAssessments = effectiveTab
    ? (allCategories.find(([id]) => id === effectiveTab)?.[1] ?? [])
    : [];
  const activeName = effectiveTab ? categoryLabel(effectiveTab) : '';
  const activeColor = effectiveTab ? (CATEGORY_COLORS[effectiveTab] ?? CATEGORY_COLORS.__other__) : '#22d3ee';
  const { score: activeScore, passed: activePassed, total: activeTotal } = categoryScore(activeAssessments);
  const activeScoreColor = activeScore >= 90 ? 'var(--score-good)' : activeScore >= 50 ? 'var(--score-ok)' : 'var(--score-bad)';

  return (
    <section className="w-full max-w-4xl space-y-5 animate-fade-up" aria-label="Scan results">

      {/* URL + action buttons */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-mono break-all" style={{ color: 'var(--text-muted)' }}>{scan.url}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadResults(scan)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--navy-mid)', border: '1px solid var(--border)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={() => shareUrl(scan)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--navy-mid)', border: '1px solid var(--border)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>

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
            <span className="text-base font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/100</span>
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

      {/* Category tab bar */}
      {(allCategories.length > 0 || isScanning) && (
        <div
          role="tablist"
          aria-label="Result categories"
          className="flex gap-2.5 overflow-x-auto"
          style={{ paddingBottom: '2px' }}
        >
          {allCategories.map(([catId, assessments]) => {
            const { score } = categoryScore(assessments);
            const issueCount = assessments.flatMap((a) => a.findings).length;
            const color = CATEGORY_COLORS[catId] ?? CATEGORY_COLORS.__other__;
            const label = categoryLabel(catId);
            const isActive = effectiveTab === catId;
            const tabScoreColor = score >= 90 ? 'var(--score-good)' : score >= 50 ? 'var(--score-ok)' : 'var(--score-bad)';

            return (
              <button
                key={catId}
                role="tab"
                id={`tab-${catId}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${catId}`}
                onClick={() => setActiveTab(catId)}
                className="flex flex-col gap-2 px-4 py-3.5 rounded-2xl transition-all duration-200 flex-1 min-w-[130px] text-left"
                style={{
                  background: isActive ? 'var(--navy-card)' : 'rgba(17,24,39,0.5)',
                  border: isActive ? `1px solid ${color}45` : '1px solid var(--border)',
                  borderTop: isActive ? `2px solid ${color}` : '2px solid transparent',
                  boxShadow: isActive ? `0 4px 24px ${color}18, inset 0 1px 0 ${color}12` : 'none',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${color}60`; }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = isActive
                    ? `0 4px 24px ${color}18, inset 0 1px 0 ${color}12`
                    : 'none';
                }}
              >
                {/* Row 1: icon + name + badge */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CategoryIcon id={catId} size={13} color={isActive ? color : 'var(--text-dim)'} />
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: isActive ? 'var(--text-base)' : 'var(--text-muted)' }}
                    >
                      {label}
                    </span>
                  </div>
                  {issueCount > 0 ? (
                    <span
                      className="mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        background: 'rgba(248,113,113,0.15)',
                        color: 'var(--error-text)',
                        border: '1px solid rgba(248,113,113,0.25)',
                      }}
                    >
                      {issueCount}
                    </span>
                  ) : (
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24"
                      stroke="var(--success-text)" strokeWidth={2.5} aria-label="All passed">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {/* Row 2: score */}
                <div className="flex items-baseline gap-0.5">
                  <span className="mono text-xl font-semibold leading-none" style={{ color: tabScoreColor }}>
                    {score}
                  </span>
                  <span className="mono text-xs leading-none" style={{ color: 'var(--text-dim)' }}>/100</span>
                </div>
              </button>
            );
          })}
          {isScanning && <SkeletonTab />}
          {isScanning && allCategories.length < 2 && <SkeletonTab />}
        </div>
      )}

      {/* Tab panel */}
      {effectiveTab && (
        <div
          key={effectiveTab}
          role="tabpanel"
          id={`tabpanel-${effectiveTab}`}
          aria-labelledby={`tab-${effectiveTab}`}
          className="rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: 'var(--navy-card)', border: `1px solid var(--border)` }}
        >
          {/* Panel header */}
          <div
            className="flex items-center gap-5 px-6 py-5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `${activeColor}18`,
                border: `1px solid ${activeColor}35`,
              }}
            >
              <CategoryIcon id={effectiveTab} size={20} color={activeColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-base)' }}>
                {activeName}
              </h2>
              <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {activePassed} of {activeTotal} checks passed
              </p>
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="mono text-3xl font-semibold" style={{ color: activeScoreColor }}>
                {activeScore}
              </span>
              <span className="mono text-sm" style={{ color: 'var(--text-dim)' }}>/100</span>
            </div>
          </div>

          {/* Findings */}
          <div className="px-6 py-5">
            <FindingsSection name={activeName} assessments={activeAssessments} />
          </div>
        </div>
      )}
    </section>
  );
}
