import { useState } from 'react';
import type { Assessment } from '../types/scanner';
import { mergeFindings } from '../utils/findings';
import remediationTexts from '../../a11y_remidiation_texts.json';

// Build a lookup map from rule-id → plain-english text
const remediationMap = new Map<string, string>(
  (remediationTexts as { 'rule-id': string; 'plain-english': string }[]).map(
    (r) => [r['rule-id'], r['plain-english']],
  ),
);

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
    label: 'Accessibility',
    icon: '♿',
    color: 'var(--eaa-purple)',
    bg: 'var(--eaa-purple-bg)',
    desc: 'Automated checks via axe-core and Google Lighthouse — covers ARIA, colour contrast, focus management, heading order and more.',
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


function extractWcagTags(tags: string[]): string[] {
  return tags
    .filter((t) => /^wcag\d/.test(t))
    .map((t) => {
      const digits = t.replace(/^wcag/i, '');
      const formatted = digits.replace(/(\d)(?=(\d{1,2})$)/, '$1.').replace(/(\d)(?=(\d)$)/, '$1.');
      return `WCAG ${formatted}`;
    });
}

function FindingItem({ finding, defaultOpen = false }: FindingItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAllNodes, setShowAllNodes] = useState(false);

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
          {impact && (() => {
            const COLOR: Record<string, { color: string; bg: string; border: string }> = {
              critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.35)' },
              serious:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
              moderate: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)'  },
              minor:    { color: '#a3e635', bg: 'rgba(163,230,53,0.12)',  border: 'rgba(163,230,53,0.35)'  },
            };
            const c = COLOR[impact] ?? { color: '#a695ff', bg: 'rgba(124,106,247,0.12)', border: 'rgba(124,106,247,0.35)' };
            return (
              <span style={{
                display: 'inline-block',
                marginTop: 4,
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                color: c.color,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 100,
                padding: '1px 9px',
                letterSpacing: '0.03em',
              }}>
                {impact}
              </span>
            );
          })()}
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
              {(showAllNodes ? nodes : nodes.slice(0, 3)).map((node, idx) => (
                <div key={idx} className="node-snippet">
                  {node.html && <div className="node-html">{node.html}</div>}
                  {node.failure_summary && (
                    <div className="node-summary">{node.failure_summary}</div>
                  )}
                </div>
              ))}
              {nodes.length > 3 && (
                <button
                  onClick={() => setShowAllNodes((v) => !v)}
                  style={{
                    marginTop: 8,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--eaa-blue)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {showAllNodes
                    ? '− Show less'
                    : `+ Show ${nodes.length - 3} more affected element${nodes.length - 3 === 1 ? '' : 's'}`}
                </button>
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
            const plainEnglish = remediationMap.get(finding.identifier);
            if (!plainEnglish && !helpUrl) return null;
            return (
              <div
                className="remediation-panel"
                style={{ borderColor: 'var(--border)', background: 'var(--navy-mid)' }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 6 }}>
                  Remediation
                </div>

                {plainEnglish && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-base)', lineHeight: 1.6, marginBottom: helpUrl ? 10 : 0 }}>
                    {plainEnglish}
                  </p>
                )}

                {helpUrl && (
                  <a
                    href={helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--eaa-blue)', display: 'inline-block' }}
                  >
                    Learn how to fix ↗
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/** Averages score_percent across all completed assessments that provide one. */
function normalizedCategoryScore(assessments: Assessment[]): number | undefined {
  const scores = assessments
    .filter((a) => a.status === 'completed' && typeof a.details?.score_percent === 'number')
    .map((a) => a.details!.score_percent as number);
  if (scores.length === 0) return undefined;
  return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
}

/** Builds a "Axe: 84% · Lighthouse: 82%" sub-label when multiple scores exist. */
function scoreSubLabel(assessments: Assessment[]): string | undefined {
  const parts = assessments
    .filter((a) => a.status === 'completed' && typeof a.details?.score_percent === 'number')
    .map((a) => {
      const label = a.identifier.charAt(0).toUpperCase() + a.identifier.slice(1);
      return `${label}: ${a.details!.score_percent as number}%`;
    });
  return parts.length > 1 ? parts.join(' · ') : undefined;
}

const IMPACT_ORDER: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function CategoryPanel({ assessments, meta }: { assessments: Assessment[]; meta: ReturnType<typeof fallbackMeta> }) {
  const mergedFindings = mergeFindings(assessments).slice().sort((a, b) => {
    const ai = typeof a.details.impact === 'string' ? (IMPACT_ORDER[a.details.impact] ?? 4) : 4;
    const bi = typeof b.details.impact === 'string' ? (IMPACT_ORDER[b.details.impact] ?? 4) : 4;
    return ai - bi;
  });
  const score = normalizedCategoryScore(assessments);
  const subLabel = scoreSubLabel(assessments);

  // Axe-specific stats (passes/violations) from the axe assessment if present
  const axeAssessment = assessments.find((a) => a.identifier === 'axe');
  const axePasses = typeof axeAssessment?.details?.passes_count === 'number'
    ? axeAssessment.details.passes_count as number
    : undefined;
  const axeViolations = typeof axeAssessment?.details?.violations_count === 'number'
    ? axeAssessment.details.violations_count as number
    : undefined;

  const allCompleted = assessments.every((a) => a.status === 'completed');

  return (
    <div>
      {/* Category header */}
      <div
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
          {score !== undefined ? (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: meta.color }}>{score}%</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${score}%`, background: meta.color }} />
              </div>
              {subLabel ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{subLabel}</div>
              ) : axePasses !== undefined && axeViolations !== undefined ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {axePasses} pass · {axeViolations} fail
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Score</div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
              {allCompleted ? 'No score' : 'Pending'}
            </div>
          )}
        </div>
      </div>

      {/* No findings */}
      {allCompleted && mergedFindings.length === 0 && (
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
            {/* Show message/hosted_by from any assessment that has them */}
            {(() => {
              const withMessage = assessments.find((a) => typeof a.details?.message === 'string');
              return withMessage ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-base)' }}>
                    {withMessage.details!.message as string}
                  </p>
                  {typeof withMessage.details?.hosted_by === 'string' && (
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
                      Hosted by {withMessage.details!.hosted_by as string}
                    </span>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '0.88rem', color: 'var(--eaa-green)' }}>No issues found.</p>
              );
            })()}
          </div>
        </div>
      )}

      {/* Findings list */}
      {mergedFindings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mergedFindings.map((f, i) => (
            <FindingItem key={f.id} finding={f} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChecklistView({ assessments }: ChecklistViewProps) {
  const grouped = groupByCategory(
    assessments.filter((a) => a.status !== 'skipped' && a.identifier !== 'http-fetch'),
  );
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
          const totalFindings = mergeFindings(group).length;
          return (
            <button
              key={key}
              className={`eaa-tab${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span aria-hidden="true">{m.icon}</span>
              {m.label}
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
      {tabs.filter((t) => t === activeTab).map((key) => (
        <CategoryPanel key={key} assessments={grouped.get(key)!} meta={meta(key)} />
      ))}
    </div>
  );
}
