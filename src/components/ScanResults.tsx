import { useState, useRef } from 'react';
import type { Assessment, Scan } from '../types/scanner';
import { ScoreRing } from './ScoreRing';
import { LetterGrade } from './LetterGrade';
import { CategoryBreakdown } from './CategoryBreakdown';
import { ChecklistView } from './ChecklistView';
import { RecommendationRoadmap } from './RecommendationRoadmap';
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

// ── Carbon footprint overview ─────────────────────────────────────────────────

function ratingColor(rating: string): { color: string; bg: string } {
  switch (rating) {
    case 'A': return { color: 'var(--score-good)', bg: 'var(--eaa-green-bg)' };
    case 'B': return { color: 'var(--score-good)', bg: 'var(--eaa-green-bg)' };
    case 'C': return { color: 'var(--eaa-amber)', bg: 'var(--eaa-amber-bg)' };
    case 'D': return { color: 'var(--eaa-amber)', bg: 'var(--eaa-amber-bg)' };
    default:  return { color: 'var(--eaa-red)',   bg: 'var(--eaa-red-bg)'   };
  }
}

function CarbonFootprintOverview({ assessments }: { assessments: Assessment[] }) {
  const cfAssessment = assessments.find((a) => a.identifier === 'carbon-footprint');
  if (!cfAssessment || !cfAssessment.details) return null;

  const details = cfAssessment.details as {
    rating?: string;
    co2_per_visit?: number;
    annual_co2_kg?: number;
    total_bytes?: number;
    green_hosting?: boolean;
    segments?: {
      dataCenterCO2e?: number;
      dataCenterOperationalCO2e?: number;
      dataCenterEmbodiedCO2e?: number;
      networkCO2e?: number;
      networkOperationalCO2e?: number;
      networkEmbodiedCO2e?: number;
      consumerDeviceCO2e?: number;
      consumerDeviceOperationalCO2e?: number;
      consumerDeviceEmbodiedCO2e?: number;
      firstVisitCO2e?: number;
      returnVisitCO2e?: number;
    };
  };

  // Green hosting: prefer the flag embedded directly in carbon details,
  // fall back to the companion green-hosting assessment score.
  const ghAssessment = assessments.find((a) => a.identifier === 'green-hosting');
  const isGreenHosted =
    typeof details.green_hosting === 'boolean'
      ? details.green_hosting
      : ghAssessment?.status === 'completed' &&
        (ghAssessment.details as Record<string, unknown> | null)?.score === 1;
  const hostedBy = (ghAssessment?.details as Record<string, unknown> | null)?.hosted_by as string | undefined;

  const rating = details.rating ?? '?';
  const { color, bg } = ratingColor(rating);

  const co2Visit  = typeof details.co2_per_visit === 'number' ? details.co2_per_visit : null;
  const annualCo2 = typeof details.annual_co2_kg === 'number' ? details.annual_co2_kg : null;
  const pageSizeMb = typeof details.total_bytes === 'number'
    ? details.total_bytes / 1_048_576
    : null;

  const seg = details.segments;
  const dcCO2   = seg?.dataCenterCO2e     ?? 0;
  const netCO2  = seg?.networkCO2e        ?? 0;
  const devCO2  = seg?.consumerDeviceCO2e ?? 0;
  const segTotal = dcCO2 + netCO2 + devCO2;
  const hasSegments = segTotal > 0;

  const firstVisit  = seg?.firstVisitCO2e  ?? null;
  const returnVisit = seg?.returnVisitCO2e ?? null;

  const pct = (v: number) => segTotal > 0 ? `${((v / segTotal) * 100).toFixed(1)}%` : '0%';

  const SEGMENT_COLORS = {
    dc:  { op: '#6366f1', em: '#4f46e5', label: 'Data Center'    },
    net: { op: '#0ea5e9', em: '#0284c7', label: 'Network'         },
    dev: { op: '#10b981', em: '#059669', label: 'Consumer Device' },
  };

  return (
    <div
      style={{
        background: 'var(--navy-card)',
        border: `1px solid ${color}40`,
        borderRadius: 16,
        padding: '1.25rem',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.1rem' }}>🌍</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>
            Carbon Footprint
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.25rem 0.75rem', borderRadius: 20, background: bg, border: `1px solid ${color}40` }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 700, color }}>{rating}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Carbon Rating</span>
        </div>
      </div>

      {/* ── Top-level metrics ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: hasSegments ? '1rem' : 0 }}>
        {co2Visit !== null && (
          <div style={{ flex: '1 1 110px', background: 'var(--navy-mid)', borderRadius: 10, border: '1px solid var(--border)', padding: '0.65rem 0.85rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.05rem', fontWeight: 700, color }}>{co2Visit.toFixed(3)} g</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>CO₂ per visit</div>
          </div>
        )}
        {annualCo2 !== null && (
          <div style={{ flex: '1 1 130px', background: 'var(--navy-mid)', borderRadius: 10, border: '1px solid var(--border)', padding: '0.65rem 0.85rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-base)' }}>{annualCo2.toFixed(2)} kg</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>CO₂/year (10k visitors/mo)</div>
          </div>
        )}
        {pageSizeMb !== null && (
          <div style={{ flex: '1 1 90px', background: 'var(--navy-mid)', borderRadius: 10, border: '1px solid var(--border)', padding: '0.65rem 0.85rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-base)' }}>{pageSizeMb.toFixed(2)} MB</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>Page transfer size</div>
          </div>
        )}
        <div style={{ flex: '1 1 130px', background: isGreenHosted ? 'var(--eaa-green-bg)' : 'var(--navy-mid)', borderRadius: 10, border: `1px solid ${isGreenHosted ? 'var(--score-good)' : 'var(--border)'}40`, padding: '0.65rem 0.85rem' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.05rem', fontWeight: 700, color: isGreenHosted ? 'var(--score-good)' : 'var(--text-muted)' }}>
            {isGreenHosted ? '✔' : '✘'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
            {isGreenHosted ? `Green hosting${hostedBy ? ` (${hostedBy})` : ''}` : 'No green hosting detected'}
          </div>
        </div>
      </div>

      {/* ── Segment breakdown (only when SWDMv4 segment data is present) ── */}
      {hasSegments && (
        <div style={{ background: 'var(--navy-mid)', borderRadius: 10, border: '1px solid var(--border)', padding: '0.75rem 0.9rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>
            Emissions by system segment
          </div>

          {/* Stacked proportional bar */}
          <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: '0.65rem', gap: 1 }}>
            {[
              { value: dcCO2,  color: SEGMENT_COLORS.dc.op,  label: SEGMENT_COLORS.dc.label  },
              { value: netCO2, color: SEGMENT_COLORS.net.op, label: SEGMENT_COLORS.net.label },
              { value: devCO2, color: SEGMENT_COLORS.dev.op, label: SEGMENT_COLORS.dev.label },
            ].map(({ value, color: c, label }) => (
              <div
                key={label}
                title={`${label}: ${(value * 1000).toFixed(2)} mgCO₂e (${pct(value)})`}
                style={{ width: pct(value), background: c, transition: 'width 0.4s ease', minWidth: value > 0 ? 2 : 0 }}
              />
            ))}
          </div>

          {/* Legend rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { value: dcCO2,  opVal: seg?.dataCenterOperationalCO2e      ?? 0, emVal: seg?.dataCenterEmbodiedCO2e      ?? 0, ...SEGMENT_COLORS.dc,  icon: '🏢' },
              { value: netCO2, opVal: seg?.networkOperationalCO2e          ?? 0, emVal: seg?.networkEmbodiedCO2e          ?? 0, ...SEGMENT_COLORS.net, icon: '📡' },
              { value: devCO2, opVal: seg?.consumerDeviceOperationalCO2e   ?? 0, emVal: seg?.consumerDeviceEmbodiedCO2e   ?? 0, ...SEGMENT_COLORS.dev, icon: '💻' },
            ].map(({ value, opVal, emVal, op, em, label, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', width: 18 }}>{icon}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: '0 0 115px' }}>{label}</span>
                {/* mini bar */}
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct(value), background: op, borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: op, minWidth: 42, textAlign: 'right' }}>
                  {pct(value)}
                </span>
                {/* operational / embodied sub-label */}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', minWidth: 135, whiteSpace: 'nowrap' }}>
                  <span style={{ color: op }}>{(opVal * 1000).toFixed(1)}</span>
                  {' '}op · <span style={{ color: em }}>{(emVal * 1000).toFixed(1)}</span> emb mgCO₂e
                </span>
              </div>
            ))}
          </div>

          {/* First visit vs return visit */}
          {(firstVisit !== null || returnVisit !== null) && (
            <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {firstVisit !== null && (
                <div style={{ flex: '1 1 110px', background: 'var(--navy-card)', borderRadius: 8, border: '1px solid var(--border)', padding: '0.5rem 0.7rem' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-base)' }}>
                    {(firstVisit * 1000).toFixed(0)} mg
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 1 }}>First visit CO₂e</div>
                </div>
              )}
              {returnVisit !== null && (
                <div style={{ flex: '1 1 110px', background: 'var(--navy-card)', borderRadius: 8, border: '1px solid var(--border)', padding: '0.5rem 0.7rem' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', fontWeight: 700, color: 'var(--score-good)' }}>
                    {(returnVisit * 1000).toFixed(0)} mg
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 1 }}>Return visit CO₂e</div>
                </div>
              )}
              {firstVisit !== null && returnVisit !== null && (
                <div style={{ flex: '1 1 130px', background: 'var(--navy-card)', borderRadius: 8, border: '1px solid var(--border)', padding: '0.5rem 0.7rem' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', fontWeight: 700, color: 'var(--score-good)' }}>
                    −{(((firstVisit - returnVisit) / firstVisit) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 1 }}>Saved on return (caching)</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ScanResultsProps {
  scan: Scan;
  isScanning?: boolean;
}

type ScanView = 'roadmap' | 'checklist';

interface ViewToggleButtonProps {
  active: ScanView;
  view: ScanView;
  label: string;
  icon: string;
  onClick: () => void;
}

function ViewToggleButton({ active, view, label, icon, onClick }: ViewToggleButtonProps) {
  const isActive = active === view;
  return (
    <button
      onClick={onClick}
      className={`eaa-tab${isActive ? ' active' : ''}`}
      style={{ flex: 1, justifyContent: 'center' }}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

export function ScanResults({ scan, isScanning = false }: ScanResultsProps) {
  const [copied, setCopied] = useState(false);
  const [scanView, setScanView] = useState<ScanView>('checklist');
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

      {/* Carbon footprint overview */}
      <CarbonFootprintOverview assessments={scan.assessments} />

      {/* Category breakdown */}
      <CategoryBreakdown assessments={scan.assessments} />

      {/* Findings view toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        <ViewToggleButton
            active={scanView}
            view="checklist"
            label="Checklist"
            icon="📋"
            onClick={() => setScanView('checklist')}
        />
        <ViewToggleButton
          active={scanView}
          view="roadmap"
          label="Roadmap"
          icon="🗺️"
          onClick={() => setScanView('roadmap')}
        />
      </div>

      {scanView === 'roadmap' ? (
        <RecommendationRoadmap assessments={scan.assessments} />
      ) : (
        <ChecklistView assessments={scan.assessments} />
      )}
    </section>
  );
}
