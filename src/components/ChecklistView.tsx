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
  activeCategory?: string;
  onCategoryChange?: (key: string) => void;
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
    desc: 'Automated checks for how usable this site is for people with disabilities — covers ARIA, colour contrast, keyboard navigation, and more.',
  },
  performance: {
    label: 'Performance',
    icon: '⚡',
    color: 'var(--eaa-blue)',
    bg: 'var(--eaa-blue-bg)',
    desc: 'How fast and responsive the website feels when you visit it.',
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
    desc: 'Checks whether the website runs on green energy and how much carbon each visit produces.',
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

/** Maps a raw axe/lighthouse tag to a human-readable label and tooltip explanation.
 *  Returns null for tags that should be hidden (e.g. internal cat.* categories). */
function tagDisplay(tag: string): { label: string; title: string } | null {
  if (tag.startsWith('cat.')) return null;

  if (tag === 'wcag2a') return { label: 'WCAG 2 Level A', title: 'Web Content Accessibility Guidelines 2 — Level A: the minimum accessibility requirements every website must meet' };
  if (tag === 'wcag2aa') return { label: 'WCAG 2 Level AA', title: 'Web Content Accessibility Guidelines 2 — Level AA: the accessibility standard required by most laws worldwide, including the EU Web Accessibility Directive' };
  if (tag === 'wcag2aaa') return { label: 'WCAG 2 Level AAA', title: 'Web Content Accessibility Guidelines 2 — Level AAA: the highest and most inclusive accessibility standard' };
  if (tag === 'wcag21a') return { label: 'WCAG 2.1 Level A', title: 'Web Content Accessibility Guidelines 2.1 — Level A: minimum requirements, expanded in 2018 to better cover mobile and cognitive disabilities' };
  if (tag === 'wcag21aa') return { label: 'WCAG 2.1 Level AA', title: 'Web Content Accessibility Guidelines 2.1 — Level AA: the standard referenced by the EU Web Accessibility Directive and European Accessibility Act' };

  // wcag + criterion number, e.g. wcag412 → WCAG 4.1.2
  const wcagCritMatch = tag.match(/^wcag(\d{2,})$/i);
  if (wcagCritMatch) {
    const d = wcagCritMatch[1];
    const formatted = d.length === 3
      ? `${d[0]}.${d[1]}.${d[2]}`
      : d.length === 2
        ? `${d[0]}.${d[1]}`
        : d;
    return { label: `WCAG ${formatted}`, title: `WCAG success criterion ${formatted} — a specific rule from the Web Content Accessibility Guidelines that this issue violates` };
  }

  if (tag === 'section508') return { label: 'Section 508', title: 'Section 508 of the US Rehabilitation Act — US federal law requiring all government technology to be accessible to people with disabilities' };
  if (tag.startsWith('section508.')) {
    const sub = tag.replace('section508.', '');
    return { label: `Section 508 §${sub}`, title: `Section 508 of the US Rehabilitation Act, paragraph ${sub} — a specific accessibility requirement under US federal law` };
  }

  if (tag === 'TTv5') return { label: 'Trusted Tester v5', title: 'US Department of Homeland Security Trusted Tester v5 — a standardised step-by-step method for manually testing website accessibility on US federal systems' };
  const ttMatch = tag.match(/^TT(\d+\.\w+)$/);
  if (ttMatch) return { label: `Trusted Tester ${ttMatch[1]}`, title: `Trusted Tester test ${ttMatch[1]} — a specific manual accessibility test step from the US DHS Trusted Tester methodology` };

  if (tag === 'EN-301-549') return { label: 'EN 301 549', title: 'EN 301 549 — the European standard for accessible ICT (Information and Communications Technology) products and services; this is the technical standard behind the EU Web Accessibility Directive and the European Accessibility Act (EAA)' };
  if (tag.startsWith('EN-')) {
    const sub = tag.replace(/^EN-/, '');
    return { label: `EN ${sub}`, title: `EN 301 549 clause ${sub} — a specific requirement from the European accessibility standard that underpins the EU Web Accessibility Directive and European Accessibility Act` };
  }

  if (tag === 'ACT') return { label: 'ACT Rules', title: 'Accessibility Conformance Testing Rules — a W3C framework that defines standardised, repeatable rules for automated and semi-automated accessibility testing' };

  if (tag === 'RGAAv4') return { label: 'RGAA v4', title: "Référentiel Général d'Amélioration de l'Accessibilité v4 — the French national accessibility standard for public-sector websites" };
  if (tag.startsWith('RGAA-')) {
    const sub = tag.replace('RGAA-', '');
    return { label: `RGAA ${sub}`, title: `RGAA criterion ${sub} — a specific requirement from the French national accessibility standard (Référentiel Général d'Amélioration de l'Accessibilité)` };
  }

  if (tag === 'best-practice') return { label: 'Best Practice', title: 'A web accessibility best practice recommended by the axe testing engine — not a strict legal requirement, but strongly advisable' };

  // Fallback: show the raw tag without an abbr
  return { label: tag, title: '' };
}

function prettifyIdentifier(id: string): string {
  return id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function impactLabel(impact: string): string {
  if (impact === 'critical') return 'Urgent';
  if (impact === 'serious') return 'Should fix';
  if (impact === 'moderate') return 'Worth reviewing';
  return impact.charAt(0).toUpperCase() + impact.slice(1);
}

const TITLE_OVERRIDES: Record<string, string> = {
  // Performance metrics
  'first-contentful-paint': 'Time until something first appears on screen',
  'largest-contentful-paint': 'Time until the main content is visible',
  'total-blocking-time': 'Time the page was frozen and unresponsive',
  'speed-index': 'How quickly the visible page fills in',
  'interactive': 'Time until the page responds to clicks and taps',
  'max-potential-fid': 'Worst-case delay before the page reacts to your first click',
  // Performance opportunities
  'render-blocking-resources': 'Remove files that delay the page from appearing',
  'uses-responsive-images': 'Images are larger than they need to be',
  'offscreen-images': 'Load images only when the visitor scrolls to them',
  'unminified-javascript': 'Shrink code files by removing unnecessary characters',
  'unused-css-rules': "Remove styling code that this page doesn't actually use",
  'unused-javascript': "Remove program code that this page doesn't actually use",
  'uses-rel-preconnect': 'Start connecting to other servers earlier',
  'redirects': 'The page bounces through multiple addresses before loading',
  'total-byte-weight': 'Too much data to download',
  'uses-long-cache-ttl': 'Files could be saved locally so repeat visitors load faster',
  'legacy-javascript': "Stop sending old compatibility code to browsers that don't need it",
  'dom-size': 'The page structure is overly complex',
  'bootup-time': 'Code on this page takes too long to run',
  'mainthread-work-breakdown': "The browser's main processor is overloaded",
  'third-party-summary': 'External services froze the page',
  'largest-contentful-paint-element': 'The slowest-loading piece of main content',
  'unsized-images': 'Images are missing size information, causing the page to jump around while loading',
  // Performance insights
  'document-latency-insight': 'Delay before the page starts loading',
  'font-display-insight': 'Text is invisible while custom fonts load',
  'forced-reflow-insight': 'Layout recalculations slowing down the page',
  'image-delivery-insight': 'Images could be delivered more efficiently',
  'lcp-discovery-insight': 'The browser found the main image/content too late',
  'legacy-javascript-insight': "Outdated code that modern browsers don't need",
  'network-dependency-tree-insight': 'Files are loading in a chain (each waits for the previous one)',
  'render-blocking-insight': 'Files that prevent the page from displaying until they finish loading',
  'cache-insight': 'Let browsers remember files longer to speed up repeat visits',
  // Accessibility
  'aria-allowed-attr': 'Interactive elements must be correctly labelled for assistive technology',
  'color-contrast': 'Text colours must be easy to read against their background',
  'tabindex': 'Keyboard navigation order should not be manually overridden',
  'heading-order': 'Page headings should follow a logical order (e.g. main heading, then subheading)',
  'landmark-unique': 'Page sections should each have a unique label so screen readers can tell them apart',
  'target-size': 'Buttons and links are too small or too close together to tap easily',
  'label-content-name-mismatch': 'Some buttons show one label visually but announce a different one to screen readers',
  // Design
  'css-animation-overuse': 'Too many animations',
  'non-next-gen-image-format': 'Images use outdated file formats',
  // Sustainability findings
  'co2-per-visit': 'Carbon per visit',
  'annual-co2-estimate': 'Estimated yearly carbon emissions',
  'carbon-rating': 'Carbon rating',
};

/** Converts raw Lighthouse displayValue strings to plain-English equivalents. */
function formatDisplayValue(raw: string): string {
  // Normalize non-breaking spaces
  const s = raw.replace(/\u00a0/g, ' ');

  // "Est savings of X KiB" / "Est savings of X ms"
  const estMatch = s.match(/^Est savings of ([\d,]+(?:\.\d+)?)\s*(KiB|ms|s)$/i);
  if (estMatch) {
    const val = parseFloat(estMatch[1].replace(/,/g, ''));
    const unit = estMatch[2].toLowerCase();
    if (unit === 'kib') {
      if (val >= 1024) return `Could save ~${(val / 1024).toFixed(1)} MB`;
      return `Could save ~${Math.round(val)} KB`;
    }
    if (unit === 'ms') {
      if (val >= 1000) return `Could save ~${(val / 1000).toFixed(1)} seconds`;
      return `Could save ~${Math.round(val)} ms`;
    }
    if (unit === 's') return `Could save ~${val} seconds`;
  }

  // "X KiB" → "X KB" or "X MB"
  const kibMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*KiB$/i);
  if (kibMatch) {
    const val = parseFloat(kibMatch[1].replace(/,/g, ''));
    if (val >= 1024) return `${(val / 1024).toFixed(1)} MB`;
    return `${Math.round(val)} KB`;
  }

  // "X ms" → "X seconds" if ≥ 1000
  const msMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*ms$/i);
  if (msMatch) {
    const val = parseFloat(msMatch[1].replace(/,/g, ''));
    if (val >= 1000) return `${(val / 1000).toFixed(1)} seconds`;
    return s;
  }

  // "X s" → "X seconds"
  const secMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*s$/i);
  if (secMatch) {
    return `${secMatch[1]} seconds`;
  }

  // "X elements" → keep as-is but can be extended
  return s;
}

function FindingItem({ finding, defaultOpen = false }: FindingItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAllNodes, setShowAllNodes] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  const title =
    TITLE_OVERRIDES[finding.identifier] ??
    (typeof finding.details.title === 'string'
      ? finding.details.title
      : prettifyIdentifier(finding.identifier));
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
              serious: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
              moderate: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)' },
              minor: { color: '#a3e635', bg: 'rgba(163,230,53,0.12)', border: 'rgba(163,230,53,0.35)' },
            };
            const c = COLOR[impact] ?? { color: '#a695ff', bg: 'rgba(124,106,247,0.12)', border: 'rgba(124,106,247,0.35)' };
            return (
              <span style={{
                display: 'inline-block',
                marginTop: 4,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: c.color,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 100,
                padding: '1px 9px',
                letterSpacing: '0.03em',
              }}>
                {impactLabel(impact)}
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
            {formatDisplayValue(displayValue)}
          </span>
        )}
        {wcagTags.length > 0 && (
          <span className="wcag-tag">
            <abbr title="Web Content Accessibility Guidelines — the international standard for accessible web content, published by the W3C" style={{ textDecoration: 'none' }}>{wcagTags[0]}</abbr>
          </span>
        )}
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

          {/* Remediation guidance — shown right after the description */}
          {(() => {
            const plainEnglish = remediationMap.get(finding.identifier);
            if (!plainEnglish && !helpUrl && !suggestion) return null;
            return (
              <div
                className="remediation-panel"
                style={{ borderColor: 'var(--border)', background: 'var(--navy-mid)' }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 6 }}>
                  How to fix this
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

          {/* Affected HTML nodes */}
          {nodes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="fix-label" style={{ marginBottom: 8 }}>
                Found on {nodes.length} element{nodes.length === 1 ? '' : 's'}
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
            const co2Bg = total < 0.5 ? 'rgba(61,214,140,0.10)' : total < 1.0 ? 'rgba(245,158,11,0.10)' : 'rgba(244,63,94,0.10)';
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
              ⓘ{' '}
              {wcagTags.map((t, i) => (
                <span key={t}>
                  {i > 0 && ' · '}
                  <abbr title="Web Content Accessibility Guidelines — the international standard for accessible web content, published by the W3C">{t}</abbr>
                </span>
              ))}
              {' · '}
              <abbr title="European Accessibility Act Annex I — the list of accessibility requirements that all digital products and services sold in the EU must meet by 28 June 2025">EAA Annex I</abbr>
            </span>
          )}

          {/* WCAG / standard tags */}
          {(() => {
            const visibleTags = tags.map((t) => ({ tag: t, info: tagDisplay(t) })).filter(({ info }) => info !== null);
            if (visibleTags.length === 0) return null;
            return (
              <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {visibleTags.map(({ tag, info }) => (
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
                    {info!.title ? <abbr title={info!.title} style={{ textDecoration: 'underline dotted', cursor: 'help' }}>{info!.label}</abbr> : info!.label}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function getLetterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--score-good)';
  if (score >= 70) return 'var(--score-ok)';
  return 'var(--score-bad)';
}

function getScoreBg(score: number): string {
  if (score >= 90) return 'var(--eaa-green-bg)';
  if (score >= 70) return 'var(--eaa-amber-bg)';
  return 'var(--eaa-red-bg)';
}

/** Averages score_percent across all completed assessments that provide one. */
function normalizedCategoryScore(assessments: Assessment[]): number | undefined {
  const scores = assessments
    .filter((a) => a.status === 'completed' && typeof a.details?.score_percent === 'number')
    .map((a) => a.details!.score_percent as number);
  if (scores.length === 0) return undefined;
  return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
}

/** Returns per-tool scores when multiple assessments provide one. */
function scoreSubLabel(assessments: Assessment[]): { tool: string; score: number }[] | undefined {
  const scores = assessments
    .filter((a) => a.status === 'completed' && typeof a.details?.score_percent === 'number')
    .map((a) => ({ tool: a.identifier, score: a.details!.score_percent as number }));
  return scores.length > 1 ? scores : undefined;
}

const IMPACT_ORDER: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function CategoryPanel({ assessments, meta, category }: { assessments: Assessment[]; meta: ReturnType<typeof fallbackMeta>; category: string }) {
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
      {/* Category header — hidden; tab cards already show icon/label/grade/score */}
      {false && (
      <div
        style={{
          background: 'var(--navy-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '1.2rem 1.5rem',
          marginBottom: '1.2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {subLabel!.map((s, i) => (
                      <span key={s.tool}>
                        {i > 0 && ' · '}
                        <abbr title={s.tool}>{s.score}%</abbr>
                      </span>
                    ))}
                  </div>
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
        {category === 'accessibility' && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.8rem', marginBottom: 0, lineHeight: 1.5 }}>
            Please note that only 20% to 50% of all accessibility issues can automatically be detected.
            <strong>Manual testing is always required.</strong> For more information see:{' '}
            <a href="https://testparty.ai/blog/automated-accessibility-testing-guide" target="_blank" rel="noreferrer" style={{ color: 'var(--eaa-purple)' }}>
              testparty.ai/blog/automated-accessibility-testing-guide
            </a>
          </p>
        )}
      </div>
      )}

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

export function ChecklistView({ assessments, activeCategory, onCategoryChange }: ChecklistViewProps) {
  const grouped = groupByCategory(
    assessments.filter((a) => a.status !== 'skipped' && a.identifier !== 'http-fetch'),
  );
  const tabs = [...grouped.keys()].sort((a, b) => {
    if (a === 'sustainability') return -1;
    if (b === 'sustainability') return 1;
    return 0;
  });
  const defaultTab = tabs.includes('sustainability') ? 'sustainability' : tabs[0] ?? '';
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = activeCategory ?? internalTab;
  const setActiveTab = onCategoryChange ?? setInternalTab;

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
      {/* Unified category selector */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, gap: 8, marginBottom: '1rem' }}>
        {tabs.map((key) => {
          const m = meta(key);
          const group = grouped.get(key)!;
          const totalFindings = mergeFindings(group).length;
          const score = normalizedCategoryScore(group);
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                padding: '0.9rem 1.1rem',
                borderRadius: 12,
                border: `1px solid ${isActive ? m.color + '66' : 'var(--border)'}`,
                background: isActive ? m.bg : 'var(--navy-card)',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              {/* Top row: icon + label + count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
                <span style={{ fontSize: '1rem' }} aria-hidden="true">{m.icon}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isActive ? m.color : 'var(--text-base)', flex: 1 }}>
                  {m.label}
                </span>
                {totalFindings > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: isActive ? m.color : 'var(--text-dim)',
                    background: isActive ? m.color + '22' : 'var(--navy-mid)',
                    border: `1px solid ${isActive ? m.color + '44' : 'var(--border)'}`,
                    borderRadius: 100,
                    padding: '1px 7px',
                    flexShrink: 0,
                  }}>
                    {totalFindings}
                  </span>
                )}
              </div>
              {/* Grade badge + score */}
              {score !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                  <div style={{
                    width: 32,
                    height: 26,
                    borderRadius: 6,
                    background: getScoreBg(score),
                    border: `1px solid ${getScoreColor(score)}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: getScoreColor(score),
                    flexShrink: 0,
                  }}>
                    {getLetterGrade(score)}
                  </div>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: getScoreColor(score), borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: getScoreColor(score),
                    flexShrink: 0,
                  }}>
                    {score}%
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel — header stripped since tab already contains icon/label/score */}
      {tabs.filter((t) => t === activeTab).map((key) => (
        <CategoryPanel key={key} assessments={grouped.get(key)!} meta={meta(key)} category={key} />
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: '1.2rem' }}>
        {[
          { cls: 'status-fail', label: 'Urgent' },
          { cls: 'status-warn', label: 'Should fix' },
          { cls: 'status-info', label: 'Worth reviewing' },
        ].map(({ cls, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <div className={`check-status ${cls}`} style={{ width: 16, height: 16, fontSize: 9 }}>•</div>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
