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
  performance: {
    label: 'Performance',
    icon: '⚡',
    color: 'var(--eaa-blue)',
    bg: 'var(--eaa-blue-bg)',
    desc: 'Lighthouse performance metrics — measures loading speed, interactivity, and visual stability.',
  },
  design: {
    label: 'Design',
    icon: '🎨',
    color: 'var(--eaa-teal)',
    bg: 'var(--eaa-teal-bg)',
    desc: 'Design quality checks — image formats, CSS animations, web fonts, and embedded media.',
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

function scoreClass(score: number): string {
  if (score >= 0.9) return 'status-pass';
  if (score >= 0.5) return 'status-warn';
  return 'status-fail';
}
function scoreSymbol(score: number): string {
  if (score >= 0.9) return '✓';
  if (score >= 0.5) return '!';
  return '✕';
}

/** Converts inline markdown links [text](url) to <a> elements. */
function renderMarkdownLinks(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <a key={i} href={match[2]} target="_blank" rel="noreferrer" style={{ color: 'var(--eaa-blue)' }}>
          {match[1]}
        </a>
      );
    }
    return part;
  });
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

function prettifyIdentifier(id: string): string {
  return id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function FindingItem({ finding, defaultOpen = false }: FindingItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAllNodes, setShowAllNodes] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  const title =
    typeof finding.details.title === 'string'
      ? finding.details.title
      : prettifyIdentifier(finding.identifier);
  const description =
    typeof finding.details.description === 'string'
      ? finding.details.description
      : typeof finding.details.explanation === 'string'
        ? finding.details.explanation
        : undefined;
  const impact = typeof finding.details.impact === 'string' ? finding.details.impact : undefined;
  const findingScore = typeof finding.details.score === 'number' ? finding.details.score : undefined;
  const displayValue = typeof finding.details.displayValue === 'string' ? finding.details.displayValue : undefined;
  const helpUrl =
    typeof finding.details.help_url === 'string' ? finding.details.help_url : undefined;
  const suggestion =
    typeof finding.details.suggestion === 'string' ? finding.details.suggestion : undefined;
  const hostedBy =
    typeof finding.details.hosted_by === 'string' ? finding.details.hosted_by : undefined;
  const tags = Array.isArray(finding.details.tags) ? (finding.details.tags as string[]) : [];
  const nodes = Array.isArray(finding.details.nodes)
    ? (finding.details.nodes as { html?: string; failure_summary?: string }[])
    : [];
  const images = Array.isArray(finding.details.images)
    ? (finding.details.images as { src: string; format: string }[])
    : [];
  const co2Data = (finding.identifier === 'sustainability.carbon-footprint' && finding.details.co2 && typeof finding.details.co2 === 'object')
    ? (finding.details.co2 as {
        total: number;
        networkCO2e: number;
        dataCenterCO2e: number;
        firstVisitCO2e: number;
        returnVisitCO2e: number;
        totalEmbodiedCO2e: number;
        consumerDeviceCO2e: number;
        networkEmbodiedCO2e: number;
        totalOperationalCO2e: number;
        dataCenterEmbodiedCO2e: number;
        networkOperationalCO2e: number;
        dataCenterOperationalCO2e: number;
        consumerDeviceEmbodiedCO2e: number;
        consumerDeviceOperationalCO2e: number;
      })
    : null;
  const greenEnergyUsed = typeof finding.details.green_energy_used === 'boolean'
    ? finding.details.green_energy_used
    : null;

  const wcagTags = extractWcagTags(tags);
  const statusCls = impact
    ? impactClass(impact)
    : findingScore !== undefined
      ? scoreClass(findingScore)
      : suggestion
        ? 'status-warn'
        : 'status-info';
  const statusSymbol = impact
    ? impactSymbol(impact)
    : findingScore !== undefined
      ? scoreSymbol(findingScore)
      : suggestion
        ? '!'
        : 'i';

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
        <div className={`check-status ${statusCls}`}>{statusSymbol}</div>
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
        {displayValue && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.8rem',
              fontWeight: 600,
              color: findingScore !== undefined
                ? findingScore >= 0.9 ? 'var(--score-good)' : findingScore >= 0.5 ? 'var(--score-ok)' : 'var(--score-bad)'
                : 'var(--text-dim)',
              background: 'var(--navy-mid)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '2px 8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {displayValue}
          </span>
        )}
        {wcagTags.length > 0 && <span className="wcag-tag">{wcagTags[0]}</span>}
        <div className="check-expand-btn" aria-hidden="true">
          {open ? '−' : '+'}
        </div>
      </div>

      {open && (
        <div className="check-body">
          <div className="check-divider" />

          {description && (
            <p className="check-desc">{renderMarkdownLinks(description)}</p>
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

          {/* Hosted-by badge (green-hosting findings) */}
          {hostedBy && (
            <div style={{ marginBottom: 12 }}>
              <div className="fix-label" style={{ marginBottom: 8 }}>Provider</div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: '#f59e0b',
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 100,
                  padding: '3px 12px',
                }}
              >
                {hostedBy}
              </span>
            </div>
          )}

          {/* Image list (non-next-gen-image-format findings) */}
          {images.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="fix-label" style={{ marginBottom: 8 }}>
                Legacy-format images ({images.length})
              </div>
              {(showAllImages ? images : images.slice(0, 5)).map((img, idx) => {
                const basename = img.src.split('/').pop()?.split('?')[0] ?? img.src;
                return (
                  <div key={idx} className="node-snippet" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#f59e0b',
                        background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        borderRadius: 4,
                        padding: '1px 6px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {img.format}
                    </span>
                    <span
                      className="node-html"
                      title={img.src}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                    >
                      {basename}
                    </span>
                  </div>
                );
              })}
              {images.length > 5 && (
                <button
                  onClick={() => setShowAllImages((v) => !v)}
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
                  {showAllImages
                    ? '− Show less'
                    : `+ Show ${images.length - 5} more image${images.length - 5 === 1 ? '' : 's'}`}
                </button>
              )}
            </div>
          )}

          {/* Carbon footprint breakdown */}
          {co2Data && (() => {
            const fmt = (v: number) => v.toFixed(3);
            const total = co2Data.total;
            // Rating thresholds: < 0.5g = good, < 1g = ok, >= 1g = bad
            const co2Color = total < 0.5 ? '#3dd68c' : total < 1.0 ? '#f59e0b' : '#f43f5e';
            const co2Bg   = total < 0.5 ? 'rgba(61,214,140,0.10)' : total < 1.0 ? 'rgba(245,158,11,0.10)' : 'rgba(244,63,94,0.10)';
            const co2Border = total < 0.5 ? 'rgba(61,214,140,0.30)' : total < 1.0 ? 'rgba(245,158,11,0.30)' : 'rgba(244,63,94,0.30)';

            const maxSegment = Math.max(co2Data.dataCenterCO2e, co2Data.networkCO2e, co2Data.consumerDeviceCO2e);
            const pct = (v: number) => maxSegment > 0 ? Math.round((v / maxSegment) * 100) : 0;

            const segments = [
              {
                label: 'Data Centers',
                icon: '🏢',
                total: co2Data.dataCenterCO2e,
                operational: co2Data.dataCenterOperationalCO2e,
                embodied: co2Data.dataCenterEmbodiedCO2e,
                color: '#38bdf8',
                note: '22% of internet energy',
              },
              {
                label: 'Networks',
                icon: '🌐',
                total: co2Data.networkCO2e,
                operational: co2Data.networkOperationalCO2e,
                embodied: co2Data.networkEmbodiedCO2e,
                color: '#a695ff',
                note: '24% of internet energy',
              },
              {
                label: 'User Devices',
                icon: '💻',
                total: co2Data.consumerDeviceCO2e,
                operational: co2Data.consumerDeviceOperationalCO2e,
                embodied: co2Data.consumerDeviceEmbodiedCO2e,
                color: '#3dd68c',
                note: '54% of internet energy',
              },
            ];

            return (
              <div style={{ marginBottom: 14 }}>
                <div className="fix-label" style={{ marginBottom: 10 }}>Carbon Footprint (SWDMv4)</div>

                {/* Total CO2e hero */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: co2Bg,
                  border: `1px solid ${co2Border}`,
                  borderRadius: 10,
                  padding: '0.9rem 1.1rem',
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: co2Color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                    {fmt(total)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: co2Color }}>gCO₂e per page view</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                      First visit: {fmt(co2Data.firstVisitCO2e)} g · Return visit: {fmt(co2Data.returnVisitCO2e)} g
                    </div>
                  </div>
                  {greenEnergyUsed !== null && (
                    <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: greenEnergyUsed ? '#3dd68c' : '#f43f5e',
                        background: greenEnergyUsed ? 'rgba(61,214,140,0.12)' : 'rgba(244,63,94,0.12)',
                        border: `1px solid ${greenEnergyUsed ? 'rgba(61,214,140,0.35)' : 'rgba(244,63,94,0.35)'}`,
                        borderRadius: 100,
                        padding: '3px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        {greenEnergyUsed ? '⚡ Green hosting' : '⚠ Non-green hosting'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Three-segment breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {segments.map((seg) => (
                    <div key={seg.label} style={{
                      background: 'var(--navy-mid)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '0.65rem 0.9rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.95rem' }} aria-hidden="true">{seg.icon}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-base)', flex: 1 }}>{seg.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{seg.note}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', fontWeight: 600, color: seg.color }}>
                          {fmt(seg.total)} g
                        </span>
                      </div>
                      {/* Stacked bar: operational + embodied */}
                      <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct(seg.total)}%`, background: seg.color, borderRadius: 3, opacity: 0.85 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          Operational: <span style={{ color: seg.color, fontFamily: "'DM Mono', monospace" }}>{fmt(seg.operational)} g</span>
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          Embodied: <span style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>{fmt(seg.embodied)} g</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Operational vs embodied totals */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{
                    flex: 1,
                    background: 'var(--navy-mid)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '0.5rem 0.8rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>Total Operational</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>
                      {fmt(co2Data.totalOperationalCO2e)} g
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'var(--navy-mid)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '0.5rem 0.8rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>Total Embodied</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {fmt(co2Data.totalEmbodiedCO2e)} g
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* EAA reference */}
          {wcagTags.length > 0 && (
            <span className="eaa-ref">
              ⓘ {wcagTags.join(' · ')} · EAA Annex I
            </span>
          )}

          {/* Remediation guidance */}
          {(() => {
            const plainEnglish = remediationMap.get(finding.identifier);
            if (!plainEnglish && !helpUrl && !suggestion) return null;
            return (
              <div
                className="remediation-panel"
                style={{ borderColor: 'var(--border)', background: 'var(--navy-mid)' }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 6 }}>
                  Remediation
                </div>

                {(plainEnglish ?? suggestion) && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-base)', lineHeight: 1.6, marginBottom: helpUrl ? 10 : 0 }}>
                    {plainEnglish ?? suggestion}
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
    if (ai !== bi) return ai - bi;
    // Secondary sort: lower score (worse) first
    const as = typeof a.details.score === 'number' ? a.details.score : 1;
    const bs = typeof b.details.score === 'number' ? b.details.score : 1;
    return as - bs;
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
