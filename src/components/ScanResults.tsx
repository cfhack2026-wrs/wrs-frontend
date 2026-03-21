import { useState } from 'react';
import type { Assessment, Scan } from '../types/scanner';
import { ScoreRing } from './ScoreRing';
import { ChecklistView } from './ChecklistView';
import { RemediationRoadmap } from './RemediationRoadmap';

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
  return `${protocol}//${host}/#/scan/${scanId}`;
}

function exportPDF() {
  window.print();
}

// ── Score calculations ────────────────────────────────────────────────────────

function computeStats(assessments: Assessment[]) {
  const relevant = assessments.filter((a) => a.status !== 'skipped');

  const allFindings = relevant.flatMap((a) => a.findings);
  const criticalCount = allFindings.filter(
    (f) => typeof f.details.impact === 'string' && f.details.impact === 'critical',
  ).length;
  const seriousCount = allFindings.filter(
    (f) => typeof f.details.impact === 'string' && f.details.impact === 'serious',
  ).length;
  const totalFindings = allFindings.length;

  // Best available overall score: prefer Lighthouse score_percent, fall back to Axe, then pass ratio
  const lighthouseAssessment = relevant.find(
    (a) => a.identifier === 'lighthouse' && typeof a.details?.score_percent === 'number',
  );
  const axeAssessment = relevant.find(
    (a) => a.identifier === 'accessibility' && typeof a.details?.score_percent === 'number',
  );

  let overallScore: number;
  if (lighthouseAssessment && typeof lighthouseAssessment.details?.score_percent === 'number') {
    overallScore = lighthouseAssessment.details.score_percent as number;
  } else if (axeAssessment && typeof axeAssessment.details?.score_percent === 'number') {
    overallScore = axeAssessment.details.score_percent as number;
  } else {
    const passed = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed').length;
    overallScore = relevant.length > 0 ? Math.round((passed / relevant.length) * 100) : 100;
  }

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

type ViewMode = 'checklist' | 'roadmap';

export function ScanResults({ scan, isScanning = false }: ScanResultsProps) {
  const [view, setView] = useState<ViewMode>('checklist');
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = buildShareUrl(scan.id);
    const shareData = {
      title: `Scan Results for ${new URL(scan.url).hostname}`,
      text: `Check out the web responsibility scan results for ${scan.url}`,
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    <section className="w-full max-w-4xl space-y-5 animate-fade-up" aria-label="Scan results">
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
        </div>
      </div>

      {/* Score overview: ring + stats grid */}
      <div className="score-overview">
        {/* Score ring card */}
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
          }}
        >
          <ScoreRing score={stats.overallScore} size={120} />
          <p
            className="mono text-xs uppercase tracking-widest mt-3"
            style={{ color: 'var(--text-dim)', letterSpacing: '0.12em' }}
          >
            Overall Score
          </p>
          <div className="score-grade" style={{ background: grade.bg, color: grade.color }}>
            {grade.text}
          </div>
          {isScanning && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
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

      {/* Toolbar: view toggle + export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="view-toggle">
          <button
            className={`view-btn${view === 'checklist' ? ' active' : ''}`}
            onClick={() => setView('checklist')}
          >
            ☰&nbsp; Checklist
          </button>
          <button
            className={`view-btn${view === 'roadmap' ? ' active' : ''}`}
            onClick={() => setView('roadmap')}
          >
            ⚑&nbsp; Remediation Roadmap
          </button>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors"
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

      {/* Main view */}
      {view === 'checklist' ? (
        <ChecklistView assessments={scan.assessments} />
      ) : (
        <RemediationRoadmap assessments={scan.assessments} />
      )}
    </section>
  );
}
