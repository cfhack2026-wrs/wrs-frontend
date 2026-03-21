import type { Assessment, Finding } from '../types/scanner';
import { mergeFindings } from '../utils/findings';
import remediationTexts from '../../a11y_remidiation_texts.json';

const remediationMap = new Map<string, string>(
  (remediationTexts as { 'rule-id': string; 'plain-english': string }[]).map(
    (r) => [r['rule-id'], r['plain-english']],
  ),
);

export interface RoadmapItem {
  finding: Finding;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'significant';
  category: string;
  title: string;
  description?: string;
  helpUrl?: string;
  affectedElements: number;
  remediation?: string;
  solution?: string;
}

interface RoadmapSection {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  borderColor: string;
  items: RoadmapItem[];
  recommendation: string;
}

interface RecommendationRoadmapProps {
  assessments: Assessment[];
}

function getFindingPriority(finding: Finding): 'critical' | 'high' | 'medium' | 'low' {
  const impact = typeof finding.details.impact === 'string' ? finding.details.impact : 'unknown';
  switch (impact) {
    case 'critical': return 'critical';
    case 'serious': return 'high';
    case 'moderate': return 'medium';
    default: return 'low';
  }
}

function getAffectedCount(finding: Finding): number {
  if (Array.isArray(finding.details.nodes)) {
    return (finding.details.nodes as unknown[]).length;
  }
  return 0;
}

function estimateEffort(finding: Finding): 'easy' | 'medium' | 'significant' {
  const nodes = getAffectedCount(finding);
  const hasHelp = typeof finding.details.help_url === 'string';
  const impact = getFindingPriority(finding);
  
  if (nodes <= 3 && hasHelp && (impact === 'critical' || impact === 'high')) {
    return 'easy';
  }
  if (nodes <= 10 && hasHelp) {
    return 'medium';
  }
  return 'significant';
}

function buildRoadmap(assessments: Assessment[]): RoadmapSection[] {
  const merged = mergeFindings(assessments);
  
  const items: RoadmapItem[] = merged.map((f) => {
    const category = assessments.find((a) => a.findings.some((af) => af.id === f.id))?.category ?? 'other';
    const plainEnglish = remediationMap.get(f.identifier);
    return {
      finding: f,
      priority: getFindingPriority(f),
      effort: estimateEffort(f),
      category,
      title: typeof f.details.title === 'string' ? f.details.title : f.identifier,
      description: typeof f.details.description === 'string' ? f.details.description : undefined,
      helpUrl: typeof f.details.help_url === 'string' ? f.details.help_url : undefined,
      affectedElements: getAffectedCount(f),
      remediation: typeof f.details.description === 'string' ? f.details.description : undefined,
      solution: plainEnglish,
    };
  });

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const EFFORT_ORDER: Record<string, number> = { easy: 0, medium: 1, significant: 2 };

  items.sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    return EFFORT_ORDER[a.effort] - EFFORT_ORDER[b.effort];
  });

  const phase1 = items.filter((i) => i.priority === 'critical' || (i.priority === 'high' && i.effort === 'easy'));
  const phase2 = items.filter((i) => i.priority === 'high' && i.effort !== 'easy').concat(
    items.filter((i) => i.priority === 'medium' && i.effort === 'easy')
  );
  const phase3 = items.filter((i) => !phase1.includes(i) && !phase2.includes(i));

  return [
    {
      id: 'phase-1',
      label: 'Phase 1: Quick Wins',
      icon: '1',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.12)',
      borderColor: 'rgba(56,189,248,0.3)',
      items: phase1,
      recommendation: 'Address these critical and high-priority issues first. They have the biggest impact on accessibility compliance and can be resolved quickly. Start with images without alt text, missing form labels, and color contrast failures.',
    },
    {
      id: 'phase-2',
      label: 'Phase 2: Next Steps',
      icon: '2',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      borderColor: 'rgba(245,158,11,0.3)',
      items: phase2,
      recommendation: 'These issues require more planning but are essential for full compliance. Focus on keyboard navigation improvements, ARIA attribute corrections, and heading structure fixes. Consider involving your development team for complex changes.',
    },
    {
      id: 'phase-3',
      label: 'Phase 3: Future Improvements',
      icon: '3',
      color: '#f87171',
      bg: 'rgba(248,113,113,0.12)',
      borderColor: 'rgba(248,113,113,0.3)',
      items: phase3,
      recommendation: 'These enhancements improve the overall user experience but are lower priority. Schedule them for your next development sprint. Focus on code quality improvements, metatag optimizations, and progressive enhancement features.',
    },
  ].filter((s) => s.items.length > 0);
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'rgba(244,63,94,0.15)', text: '#f43f5e', label: 'Critical' },
  high: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: 'High' },
  medium: { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', label: 'Medium' },
  low: { bg: 'rgba(163,230,53,0.15)', text: '#a3e635', label: 'Low' },
};

const EFFORT_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  medium: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  significant: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1' },
};

export function RecommendationRoadmap({ assessments }: RecommendationRoadmapProps) {
  const sections = buildRoadmap(assessments);

  if (sections.length === 0) {
    return (
      <div
        style={{
          background: 'var(--navy-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
        <p style={{ color: 'var(--eaa-green)', fontWeight: 500 }}>No issues found</p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Your site passed all automated checks.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {sections.map((section) => (
        <div
          key={section.id}
          style={{
            background: 'var(--navy-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '1rem 1.25rem',
              borderBottom: `1px solid var(--border)`,
              background: section.bg,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: section.bg,
                border: `1px solid ${section.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: section.color,
              }}
            >
              {section.icon}
            </div>
            <span style={{ fontWeight: 600, color: section.color, fontSize: '0.95rem' }}>
              {section.label}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                background: section.bg,
                border: `1px solid ${section.borderColor}`,
                borderRadius: 100,
                padding: '2px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: section.color,
              }}
            >
              {section.items.length} {section.items.length === 1 ? 'issue' : 'issues'}
            </span>
          </div>

          <div style={{ padding: '0.75rem' }}>
            {section.items.map((item, idx) => (
              <div
                key={item.finding.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 10,
                  marginBottom: idx < section.items.length - 1 ? '0.5rem' : 0,
                  background: 'var(--navy-mid)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-base)' }}>
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          ...PRIORITY_COLORS[item.priority],
                        }}
                      >
                        {PRIORITY_COLORS[item.priority].label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          ...EFFORT_COLORS[item.effort],
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.effort} effort
                      </span>
                    </div>

                    {item.solution && (
                      <div
                        style={{
                          marginTop: '0.6rem',
                          padding: '0.7rem 0.85rem',
                          background: 'var(--eaa-green-bg)',
                          border: '1px solid rgba(61,214,140,0.25)',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--eaa-green)', marginBottom: 4 }}>
                          How to fix
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-base)', lineHeight: 1.55, margin: 0 }}>
                          {item.solution}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.5rem' }}>
                      {item.affectedElements > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {item.affectedElements} affected element{item.affectedElements !== 1 ? 's' : ''}
                        </span>
                      )}
                      {item.category && item.category !== 'other' && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-dim)',
                            background: 'var(--navy-card)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.helpUrl && (
                    <a
                      href={item.helpUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--eaa-blue-bg)',
                        color: 'var(--eaa-blue)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                      title="View fix guide"
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div
        style={{
          background: 'var(--navy-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '0.85rem 1.25rem',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>💡</span>
        <span>
          <strong style={{ color: 'var(--text-muted)' }}>Pro tip:</strong> Easy wins are ranked by impact and estimated fix time.
          Addressing critical issues first maximizes your accessibility score improvement per effort invested.
        </span>
      </div>
    </div>
  );
}
