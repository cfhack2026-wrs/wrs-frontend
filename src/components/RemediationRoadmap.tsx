import type { Assessment } from '../types/scanner';

interface RemediationRoadmapProps {
  assessments: Assessment[];
}

interface RoadmapFinding {
  id: string;
  identifier: string;
  title: string;
  description: string;
  impact: string;
  tags: string[];
  nodes: { html?: string; failure_summary?: string }[];
  helpUrl?: string;
  assessmentCategory: string;
  assessmentIdentifier: string;
}

const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor', ''];

function impactRank(impact: string): number {
  const idx = IMPACT_ORDER.indexOf(impact);
  return idx === -1 ? IMPACT_ORDER.length : idx;
}

function extractFindings(assessments: Assessment[]): RoadmapFinding[] {
  const results: RoadmapFinding[] = [];
  for (const a of assessments) {
    if (a.status === 'skipped') continue;
    for (const f of a.findings) {
      const title =
        typeof f.details.title === 'string' ? f.details.title : f.identifier;
      const description =
        typeof f.details.description === 'string' ? f.details.description : '';
      const impact =
        typeof f.details.impact === 'string' ? f.details.impact : '';
      const tags = Array.isArray(f.details.tags) ? (f.details.tags as string[]) : [];
      const nodes = Array.isArray(f.details.nodes)
        ? (f.details.nodes as { html?: string; failure_summary?: string }[])
        : [];
      const helpUrl =
        typeof f.details.help_url === 'string' ? f.details.help_url : undefined;

      results.push({
        id: f.id,
        identifier: f.identifier,
        title,
        description,
        impact,
        tags,
        nodes,
        helpUrl,
        assessmentCategory: a.category ?? a.identifier,
        assessmentIdentifier: a.identifier,
      });
    }
  }
  return results;
}

interface Phase {
  label: string;
  color: string;
  bg: string;
  border: string;
  timeline: string;
  items: RoadmapFinding[];
}

function buildPhases(findings: RoadmapFinding[]): Phase[] {
  const critical = findings.filter((f) => f.impact === 'critical').sort((a, b) => impactRank(a.impact) - impactRank(b.impact));
  const serious = findings.filter((f) => f.impact === 'serious').sort((a, b) => impactRank(a.impact) - impactRank(b.impact));
  const moderate = findings.filter((f) => f.impact === 'moderate' || f.impact === 'minor').sort((a, b) => impactRank(a.impact) - impactRank(b.impact));
  const other = findings.filter((f) => !['critical', 'serious', 'moderate', 'minor'].includes(f.impact));

  const phases: Phase[] = [
    {
      label: 'Phase 1 — Critical issues',
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.10)',
      border: 'rgba(244,63,94,0.30)',
      timeline: 'Fix immediately',
      items: critical,
    },
    {
      label: 'Phase 2 — Serious issues',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.10)',
      border: 'rgba(245,158,11,0.30)',
      timeline: 'Week 1–2',
      items: serious,
    },
    {
      label: 'Phase 3 — Moderate / Minor',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.10)',
      border: 'rgba(56,189,248,0.30)',
      timeline: 'Week 3–4',
      items: moderate,
    },
    {
      label: 'Phase 4 — Informational',
      color: '#a695ff',
      bg: 'rgba(124,106,247,0.10)',
      border: 'rgba(124,106,247,0.30)',
      timeline: 'Ongoing',
      items: other,
    },
  ];

  return phases.filter((p) => p.items.length > 0);
}

function impactEffortPct(impact: string): number {
  switch (impact) {
    case 'critical': return 90;
    case 'serious': return 70;
    case 'moderate': return 50;
    case 'minor': return 30;
    default: return 20;
  }
}

function extractWcagLabel(tags: string[]): string | undefined {
  const first = tags.find((t) => /^wcag\d/.test(t));
  if (!first) return undefined;
  const digits = first.replace(/^wcag/i, '');
  const formatted = digits.replace(/(\d)(?=(\d{1,2})$)/, '$1.').replace(/(\d)(?=(\d)$)/, '$1.');
  return `WCAG ${formatted}`;
}

function categoryDisplayName(cat: string): string {
  const map: Record<string, string> = {
    accessibility: 'Lighthouse',
    axe: 'Axe',
    sustainability: 'Sustainability',
  };
  return map[cat] ?? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function RoadmapItem({
  item,
  index,
  phase,
}: {
  item: RoadmapFinding;
  index: number;
  phase: Phase;
}) {
  const impactPct = impactEffortPct(item.impact);
  const wcagLabel = extractWcagLabel(item.tags);
  const catName = categoryDisplayName(item.assessmentCategory);

  return (
    <div className="roadmap-item">
      {/* Phase number badge */}
      <div
        className="ri-num"
        style={{ background: phase.bg, color: phase.color, border: `1px solid ${phase.border}` }}
      >
        {index + 1}
      </div>

      {/* Content */}
      <div>
        <div className="ri-title">{item.title}</div>
        {item.description && <div className="ri-sub">{item.description}</div>}

        <div className="ri-tags" style={{ marginTop: 8 }}>
          {item.impact && (
            <span
              className="ri-tag"
              style={{ background: phase.bg, color: phase.color, borderColor: phase.border }}
            >
              {item.impact.charAt(0).toUpperCase() + item.impact.slice(1)}
            </span>
          )}
          {wcagLabel && (
            <span
              className="ri-tag"
              style={{
                background: 'var(--eaa-accent-bg)',
                color: 'var(--eaa-accent2)',
                borderColor: 'rgba(124,106,247,0.25)',
              }}
            >
              {wcagLabel}
            </span>
          )}
          <span
            className="ri-tag"
            style={{
              background: 'var(--navy-mid)',
              color: 'var(--text-dim)',
              borderColor: 'var(--border)',
            }}
          >
            {catName}
          </span>
        </div>

        {/* First affected node */}
        {item.nodes.length > 0 && item.nodes[0].html && (
          <div className="node-snippet" style={{ marginTop: 10 }}>
            <div className="node-html">{item.nodes[0].html}</div>
            {item.nodes[0].failure_summary && (
              <div className="node-summary">{item.nodes[0].failure_summary}</div>
            )}
            {item.nodes.length > 1 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>
                + {item.nodes.length - 1} more affected element{item.nodes.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {item.helpUrl && (
          <a
            href={item.helpUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.78rem',
              color: 'var(--eaa-blue)',
              marginTop: 10,
              textDecoration: 'none',
            }}
          >
            Learn how to fix ↗
          </a>
        )}
      </div>

      {/* Meta: impact bar */}
      <div className="ri-meta">
        <div className="ri-meta-label">Impact</div>
        <div className="ri-meta-val" style={{ color: phase.color }}>
          {item.impact ? item.impact.charAt(0).toUpperCase() + item.impact.slice(1) : '—'}
        </div>
        <div className="ri-mini-bar">
          <div className="ri-mini-fill" style={{ width: `${impactPct}%`, background: phase.color }} />
        </div>
      </div>
    </div>
  );
}

export function RemediationRoadmap({ assessments }: RemediationRoadmapProps) {
  const allFindings = extractFindings(assessments);
  const phases = buildPhases(allFindings);

  const criticalCount = allFindings.filter((f) => f.impact === 'critical').length;
  const seriousCount = allFindings.filter((f) => f.impact === 'serious').length;
  const totalIssues = allFindings.length;

  return (
    <div>
      {/* Intro */}
      <div
        style={{
          background: 'var(--navy-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '1rem 1.4rem',
          marginBottom: '1.4rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 20 }}>🗺</span>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Issues are ranked by <strong style={{ color: 'var(--text-base)' }}>impact level</strong>.{' '}
          <strong style={{ color: 'var(--text-base)' }}>Phase 1 (Critical)</strong> issues must be
          resolved first to achieve EAA compliance. All critical and serious violations are blocking
          WCAG 2.x AA conformance.
        </p>
      </div>

      {/* Summary impact cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '2rem' }}>
        <div className="impact-card">
          <div className="impact-label">Critical violations</div>
          <div className="impact-val" style={{ color: 'var(--eaa-red)' }}>{criticalCount}</div>
          <div className="impact-desc">Must fix for EAA compliance</div>
        </div>
        <div className="impact-card">
          <div className="impact-label">Serious violations</div>
          <div className="impact-val" style={{ color: 'var(--eaa-amber)' }}>{seriousCount}</div>
          <div className="impact-desc">Required for WCAG 2.x AA</div>
        </div>
        <div className="impact-card">
          <div className="impact-label">Total findings</div>
          <div className="impact-val" style={{ color: 'var(--eaa-accent2)' }}>{totalIssues}</div>
          <div className="impact-desc">Across all tools</div>
        </div>
      </div>

      {/* Phase blocks */}
      {phases.length === 0 ? (
        <div
          style={{
            background: 'var(--eaa-green-bg)',
            border: '1px solid rgba(61,214,140,0.25)',
            borderRadius: 12,
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--eaa-green)',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          ✓ No issues found — this site looks great!
        </div>
      ) : (
        phases.map((phase) => (
          <div key={phase.label} style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: '1rem',
              }}
            >
              <div
                className="phase-badge"
                style={{ background: phase.bg, color: phase.color, borderColor: phase.border }}
              >
                {phase.label}
              </div>
              <div className="phase-line" />
              <div className="phase-meta">
                {phase.timeline} · {phase.items.length} item{phase.items.length !== 1 ? 's' : ''}
              </div>
            </div>

            {phase.items.map((item, idx) => (
              <RoadmapItem key={item.id} item={item} index={idx} phase={phase} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
