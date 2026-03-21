import { useState } from 'react';
import type { Assessment } from '../types/scanner';

interface ChecklistViewProps {
  assessments: Assessment[];
}

/** Groups assessments by their `category` field, using `identifier` as fallback. */
function groupByCategory(assessments: Assessment[]): Map<string, Assessment[]> {
  const map = new Map<string, Assessment[]>();
  for (const a of assessments) {
    const key = a.category ?? a.identifier;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return map;
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bg: string; desc: string }> = {
  accessibility: {
    label: 'Accessibility (Lighthouse)',
    icon: '♿',
    color: 'var(--eaa-purple)',
    bg: 'var(--eaa-purple-bg)',
    desc: 'Automated checks via Google Lighthouse — covers ARIA, colour contrast, focus management, heading order and more.',
  },
  axe: {
    label: 'Accessibility (Axe)',
    icon: '🔍',
    color: 'var(--eaa-accent)',
    bg: 'var(--eaa-accent-bg)',
    desc: 'In-depth accessibility audit using axe-core — reports WCAG 2.x A/AA violations with affected HTML elements.',
  },
  sustainability: {
    label: 'Sustainability',
    icon: '🌱',
    color: 'var(--eaa-green)',
    bg: 'var(--eaa-green-bg)',
    desc: 'Green hosting and carbon footprint — checks if the site is served from renewable-energy infrastructure.',
  },
};

function fallbackMeta(key: string) {
  return {
    label: key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: '📋',
    color: 'var(--eaa-teal)',
    bg: 'var(--eaa-teal-bg)',
    desc: '',
  };
}

interface FindingItemProps {
  finding: Assessment['findings'][number];
  defaultOpen?: boolean;
}

function impactClass(impact?: string): string {
  if (impact === 'critical') return 'status-fail';
  if (impact === 'serious') return 'status-warn';
  return 'status-info';
}
function impactSymbol(impact?: string): string {
  if (impact === 'critical') return '✕';
  if (impact === 'serious') return '!';
  return 'i';
}

const PHASE_META: Record<string, { label: string; color: string; bg: string; border: string; timeline: string }> = {
  critical: { label: 'Phase 1 — Critical', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.30)', timeline: 'Fix immediately' },
  serious:  { label: 'Phase 2 — Serious',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.30)', timeline: 'Week 1–2' },
  moderate: { label: 'Phase 3 — Moderate', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.30)',  timeline: 'Week 3–4' },
  minor:    { label: 'Phase 3 — Minor',    color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.30)',  timeline: 'Week 3–4' },
};
const PHASE_DEFAULT = { label: 'Phase 4 — Informational', color: '#a695ff', bg: 'rgba(124,106,247,0.08)', border: 'rgba(124,106,247,0.30)', timeline: 'Ongoing' };

function phaseMeta(impact?: string) {
  return (impact ? PHASE_META[impact] : undefined) ?? PHASE_DEFAULT;
}

function extractWcagTags(tags: string[]): string[] {
  return tags
    .filter((t) => /^wcag\d/.test(t))
    .map((t) => {
      // "wcag143" → "WCAG 1.4.3"
      const digits = t.replace(/^wcag/i, '');
      const formatted = digits.replace(/(\d)(?=(\d{1,2})$)/, '$1.').replace(/(\d)(?=(\d)$)/, '$1.');
      return `WCAG ${formatted}`;
    });
}

function FindingItem({ finding, defaultOpen = false }: FindingItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  const title =
    typeof finding.details.title === 'string' ? finding.details.title : finding.identifier;
  const description =
    typeof finding.details.description === 'string' ? finding.details.description : undefined;
  const impact = typeof finding.details.impact === 'string' ? finding.details.impact : undefined;
  const helpUrl =
    typeof finding.details.help_url === 'string' ? finding.details.help_url : undefined;
  const tags = Array.isArray(finding.details.tags) ? (finding.details.tags as string[]) : [];
  const nodes = Array.isArray(finding.details.nodes)
    ? (finding.details.nodes as { html?: string; failure_summary?: string }[])
    : [];

  const wcagTags = extractWcagTags(tags);
  const statusCls = impactClass(impact);

  return (
    <div className="check-item">
      <div
        className="check-header"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o); }}
      >
        <div className={`check-status ${statusCls}`}>{impactSymbol(impact)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--text-base)' }}>
            {title}
          </div>
          {impact && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 2 }}>
              Impact: {impact}
            </div>
          )}
        </div>
        {wcagTags.length > 0 && <span className="wcag-tag">{wcagTags[0]}</span>}
        <div className="check-expand-btn" aria-hidden="true">
          {open ? '−' : '+'}
        </div>
      </div>

      {open && (
        <div className="check-body">
          <div className="check-divider" />

          {description && (
            <p className="check-desc">{description}</p>
          )}

          {/* WCAG / standard tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'var(--navy-mid)',
                    color: 'var(--text-dim)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Affected HTML nodes */}
          {nodes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="fix-label" style={{ marginBottom: 8 }}>
                Affected elements ({nodes.length})
              </div>
              {nodes.slice(0, 3).map((node, idx) => (
                <div key={idx} className="node-snippet">
                  {node.html && <div className="node-html">{node.html}</div>}
                  {node.failure_summary && (
                    <div className="node-summary">{node.failure_summary}</div>
                  )}
                </div>
              ))}
              {nodes.length > 3 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 6, fontStyle: 'italic' }}>
                  + {nodes.length - 3} more affected elements
                </p>
              )}
            </div>
          )}

          {/* EAA reference */}
          {wcagTags.length > 0 && (
            <span className="eaa-ref">
              ⓘ {wcagTags.join(' · ')} · EAA Annex I
            </span>
          )}

          {/* Remediation guidance */}
          {(() => {
            const phase = phaseMeta(impact);
            return (
              <div
                className="remediation-panel"
                style={{ borderColor: phase.color, background: phase.bg }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 6 }}>
                  Remediation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: phase.color,
                      background: `${phase.color}18`,
                      border: `1px solid ${phase.border}`,
                      borderRadius: 100,
                      padding: '2px 10px',
                    }}
                  >
                    {phase.label}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{phase.timeline}</span>
                  {helpUrl && (
                    <a
                      href={helpUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--eaa-blue)', marginLeft: 'auto' }}
                    >
                      Learn how to fix ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function categoryScore(assessments: Assessment[]): { passed: number; failed: number; total: number; pct: number } {
  const relevant = assessments.filter((a) => a.status !== 'skipped');
  const passed = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed').length;
  const failed = relevant.filter((a) => a.findings.length > 0).length;
  const total = relevant.length;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 100;
  return { passed, failed, total, pct };
}

function AssessmentPanel({ assessment, meta, showHeader = true }: { assessment: Assessment; meta: ReturnType<typeof fallbackMeta>; showHeader?: boolean }) {
  const { passed, total, pct } = categoryScore([assessment]);
  const allFindings = assessment.findings;

  // Lighthouse: details has score_percent
  const lighthouseScore =
    typeof assessment.details?.score_percent === 'number'
      ? assessment.details.score_percent
      : undefined;

  // Axe: details has passes_count, violations_count
  const axePasses =
    typeof assessment.details?.passes_count === 'number'
      ? assessment.details.passes_count
      : undefined;
  const axeViolations =
    typeof assessment.details?.violations_count === 'number'
      ? assessment.details.violations_count
      : undefined;

  return (
    <div>
      {/* Category header */}
      {showHeader && <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'var(--navy-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '1.2rem 1.5rem',
          marginBottom: '1.2rem',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: meta.bg,
            border: `1px solid ${meta.color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 500, marginBottom: 3, color: 'var(--text-base)' }}>
            {meta.label}
          </h3>
          {meta.desc && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{meta.desc}</p>
          )}
        </div>
        <div className="cat-score-bar">
          {lighthouseScore !== undefined ? (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: meta.color }}>{lighthouseScore}%</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${lighthouseScore}%`, background: meta.color }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Lighthouse score</div>
            </>
          ) : axeViolations !== undefined ? (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: axeViolations === 0 ? 'var(--eaa-green)' : meta.color }}>
                {axeViolations} issue{axeViolations !== 1 ? 's' : ''}
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: axePasses !== undefined
                      ? `${Math.round((axePasses / (axePasses + axeViolations)) * 100)}%`
                      : `${pct}%`,
                    background: meta.color,
                  }}
                />
              </div>
              {axePasses !== undefined && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {axePasses} pass · {axeViolations} fail
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: meta.color }}>{pct}%</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: meta.color }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{passed}/{total} checks</div>
            </>
          )}
        </div>
      </div>}

      {/* Sustainability / no findings */}
      {assessment.status === 'completed' && allFindings.length === 0 && (
        <div
          style={{
            background: 'var(--eaa-green-bg)',
            border: '1px solid rgba(61,214,140,0.25)',
            borderRadius: 10,
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ color: 'var(--eaa-green)', fontSize: '1.1rem' }}>✓</span>
          <div>
            {typeof assessment.details?.message === 'string' ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-base)' }}>{assessment.details.message}</p>
            ) : (
              <p style={{ fontSize: '0.88rem', color: 'var(--eaa-green)' }}>No issues found.</p>
            )}
            {typeof assessment.details?.hosted_by === 'string' && (
              <span
                style={{
                  fontSize: '0.75rem',
                  background: 'var(--eaa-green-bg)',
                  color: 'var(--eaa-green)',
                  border: '1px solid rgba(61,214,140,0.3)',
                  borderRadius: 100,
                  padding: '2px 10px',
                  display: 'inline-block',
                  marginTop: 6,
                }}
              >
                Hosted by {assessment.details.hosted_by}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Findings list */}
      {allFindings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allFindings.map((f, i) => (
            <FindingItem key={f.id} finding={f} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChecklistView({ assessments }: ChecklistViewProps) {
  const grouped = groupByCategory(assessments.filter((a) => a.status !== 'skipped'));
  const tabs = [...grouped.keys()];
  const [activeTab, setActiveTab] = useState(tabs[0] ?? '');

  if (tabs.length === 0) {
    return (
      <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textAlign: 'center', padding: '2rem 0' }}>
        No assessment data available.
      </p>
    );
  }

  const meta = (key: string) => CATEGORY_META[key] ?? fallbackMeta(key);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        {[
          { cls: 'status-fail', label: 'Critical' },
          { cls: 'status-warn', label: 'Serious' },
          { cls: 'status-info', label: 'Moderate / info' },
        ].map(({ cls, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <div className={`check-status ${cls}`} style={{ width: 16, height: 16, fontSize: 9 }}>•</div>
            {label}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, gap: 8, marginBottom: '1.4rem' }}>
        {tabs.map((key) => {
          const m = meta(key);
          const group = grouped.get(key)!;
          const totalFindings = group.reduce((s, a) => s + a.findings.length, 0);
          return (
            <button
              key={key}
              className={`eaa-tab${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span aria-hidden="true">{m.icon}</span>
              {m.label.split('(')[0].trim()}
              {totalFindings > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    opacity: 0.75,
                    background: activeTab === key ? 'rgba(124,106,247,0.2)' : 'var(--navy-mid)',
                    borderRadius: 100,
                    padding: '1px 7px',
                  }}
                >
                  {totalFindings}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      {tabs.filter((t) => t === activeTab).map((key) => {
        const m = meta(key);
        const group = grouped.get(key)!;
        return (
          <div key={key}>
            {group.map((assessment, i) => (
              <AssessmentPanel key={assessment.id} assessment={assessment} meta={m} showHeader={i === 0} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
