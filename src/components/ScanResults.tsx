import { useState, useRef } from 'react';
import type { Assessment, Scan } from '../types/scanner';
import { ScoreRing } from './ScoreRing';
import { LetterGrade } from './LetterGrade';
import { CategoryBreakdown } from './CategoryBreakdown';
import { ChecklistView } from './ChecklistView';
import { mergeFindings } from '../utils/findings';
import html2pdf from 'html2pdf.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function downloadResults(scan: Scan) {
  const data = JSON.stringify(
    { website: scan.url, scanUrl: scan.monitor, status: scan.status, assessments: scan.assessments },
    null,
    2,
  );
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scan-results-${new URL(scan.url).hostname}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildShareUrl(scanId: string): string {
  const { protocol, host } = window.location;
  let baseUrl = 'https://cfhack2026-wrs.github.io/wrs-frontend';
  if (host.includes('localhost')){
    baseUrl = `${protocol}//${host}`;
  }
  return `${baseUrl}/#/scan/${scanId}`;
}

// ── Score calculations ────────────────────────────────────────────────────────

function computeStats(assessments: Assessment[]) {
  const relevant = assessments.filter((a) => a.status !== 'skipped' && a.identifier !== 'http-fetch');

  // Group by category, then deduplicate findings within each group
  const byCategory = new Map<string, Assessment[]>();
  for (const a of relevant) {
    const key = a.category ?? a.identifier;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(a);
  }
  const allFindings = [...byCategory.values()].flatMap(mergeFindings);

  const criticalCount = allFindings.filter((f) => f.details.impact === 'critical').length;
  const seriousCount  = allFindings.filter((f) => f.details.impact === 'serious').length;
  const totalFindings = allFindings.length;

  // Overall score: average of all score_percent values across assessments
  const scores = relevant
    .filter((a) => typeof a.details?.score_percent === 'number')
    .map((a) => a.details!.score_percent as number);

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
    : relevant.length > 0
      ? Math.round((relevant.filter((a) => a.findings.length === 0 && a.status === 'completed').length / relevant.length) * 100)
      : 100;

  const categories = new Set(relevant.map((a) => a.category ?? a.identifier));
  const isCompliant = criticalCount === 0 && seriousCount === 0;

  return { overallScore, criticalCount, seriousCount, totalFindings, categoriesCount: categories.size, isCompliant };
}

function gradeLabel(score: number): { text: string; color: string; bg: string } {
  if (score >= 90) return { text: 'Compliant', color: 'var(--eaa-green)', bg: 'var(--eaa-green-bg)' };
  if (score >= 70) return { text: 'Needs Work', color: 'var(--eaa-amber)', bg: 'var(--eaa-amber-bg)' };
  return { text: 'Non-Compliant', color: 'var(--eaa-red)', bg: 'var(--eaa-red-bg)' };
}

// ── Main component ────────────────────────────────────────────────────────────

interface ScanResultsProps {
  scan: Scan;
  isScanning?: boolean;
}

export function ScanResults({ scan, isScanning = false }: ScanResultsProps) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  async function handleShare() {
    await navigator.clipboard.writeText(buildShareUrl(scan.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function exportPDF() {
    const element = contentRef.current;
    if (!element) return;

    document.documentElement.classList.remove('dark');
    // waiting for render flush to be completed
    await new Promise((r) => setTimeout(r));

    const hostname = new URL(scan.url).hostname;
    const filename = `scan-report-${hostname}-${Date.now()}.pdf`;

    await html2pdf().set({
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(element).save();

    document.documentElement.classList.add('dark');
  }

  const stats = computeStats(scan.assessments);
  const grade = gradeLabel(stats.overallScore);
  const scoreColor =
    stats.overallScore >= 90
      ? 'var(--score-good)'
      : stats.overallScore >= 70
        ? 'var(--score-ok)'
        : 'var(--score-bad)';

  return (
    <section ref={contentRef} className="w-full max-w-4xl space-y-5 animate-fade-up" aria-label="Scan results">
      {/* URL + actions bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs font-mono break-all" style={{ color: 'var(--text-muted)' }}>
          {scan.url}
        </p>
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
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{
              color: copied ? 'var(--success-text)' : 'var(--text-muted)',
              background: copied ? 'rgba(134,239,172,0.08)' : 'var(--navy-mid)',
              border: `1px solid ${copied ? 'rgba(134,239,172,0.25)' : 'var(--border)'}`,
              transition: 'color 0.2s, background 0.2s, border-color 0.2s',
            }}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--navy-mid)', border: '1px solid var(--border)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Score overview: grade + ring + stats */}
      <div className="score-overview">
        {/* Grade + ring card */}
        <div
          style={{
            background: 'var(--navy-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LetterGrade score={stats.overallScore} size={64} />
            <div>
              <ScoreRing score={stats.overallScore} size={88} />
            </div>
          </div>
          <div className="score-grade" style={{ background: grade.bg, color: grade.color }}>
            {grade.text}
          </div>
          <p
            className="mono text-xs uppercase tracking-widest"
            style={{ color: 'var(--text-dim)', letterSpacing: '0.12em' }}
          >
            Overall Score
          </p>
          {isScanning && (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Scan in progress…
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div
          style={{
            background: 'var(--navy-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '1.25rem',
          }}
        >
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-num" style={{ color: 'var(--eaa-red)' }}>{stats.criticalCount}</div>
              <div className="stat-desc">Critical violations</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" style={{ color: 'var(--eaa-amber)' }}>{stats.seriousCount}</div>
              <div className="stat-desc">Serious issues</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" style={{ color: 'var(--eaa-blue)' }}>{stats.totalFindings}</div>
              <div className="stat-desc">Total findings</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" style={{ color: scoreColor }}>{stats.overallScore}</div>
              <div className="stat-desc">Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" style={{ color: 'var(--eaa-purple)' }}>{stats.categoriesCount}</div>
              <div className="stat-desc">Categories</div>
            </div>
            <div className="stat-item">
              <div
                className="stat-num"
                style={{ color: stats.isCompliant ? 'var(--eaa-green)' : 'var(--eaa-red)' }}
              >
                {stats.isCompliant ? 'Yes' : 'No'}
              </div>
              <div className="stat-desc">EAA compliant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <CategoryBreakdown assessments={scan.assessments} />

      <ChecklistView assessments={scan.assessments} />
    </section>
  );
}
