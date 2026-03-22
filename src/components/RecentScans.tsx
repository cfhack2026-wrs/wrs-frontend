import { useState } from 'react';
import type { Scan, ScanStatus } from '../types/scanner';

interface RecentScansProps {
  scans: Scan[];
  onSelect: (scan: Scan) => Promise<void>;
  onRerun: (url: string) => void;
  activeScanId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function domain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 30)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const STATUS: Record<ScanStatus, { color: string; pulse: boolean; label: string }> = {
  pending:               { color: 'var(--text-dim)',     pulse: false, label: 'queued'  },
  running:               { color: 'var(--cyan)',          pulse: true,  label: 'scanning'},
  completed:             { color: 'var(--success-text)', pulse: false, label: 'done'    },
  completed_with_errors: { color: 'var(--warning-text)', pulse: false, label: 'partial' },
  failed:                { color: 'var(--error-text)',   pulse: false, label: 'failed'  },
};

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  scan: Scan;
  index: number;
  isActive: boolean;
  isFlashing: boolean;
  onSelect: (scan: Scan) => void;
  onRerun: (url: string) => void;
  isLast: boolean;
}

function ScanRow({ scan, index, isActive, isFlashing, onSelect, onRerun, isLast }: RowProps) {
  const [hovered, setHovered] = useState(false);
  const st   = STATUS[scan.status] ?? STATUS.pending;
  const host = domain(scan.url);
  const time = relativeTime(scan.created_at);

  return (
    <div
      role="listitem"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0.7rem 1rem',
        borderLeft: isActive ? '2px solid rgba(34,211,238,0.55)' : '2px solid transparent',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: isFlashing
          ? 'rgba(34,211,238,0.12)'
          : isActive
            ? 'rgba(34,211,238,0.05)'
            : hovered
              ? 'rgba(255,255,255,0.03)'
              : 'transparent',
        transition: 'background 0.15s, border-left-color 0.2s',
        animation: `fade-up 0.32s cubic-bezier(0.16,1,0.3,1) ${index * 40}ms both`,
      }}
    >
      {/* Status dot */}
      <span
        aria-hidden="true"
        className={st.pulse ? 'animate-pulse' : ''}
        style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: st.color,
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      />
      <span className="sr-only">Status: {st.label}</span>

      {/* Clickable view area */}
      <button
        type="button"
        onClick={() => onSelect(scan)}
        disabled={isActive}
        aria-label={`View scan for ${host}`}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: isActive ? 'default' : 'pointer',
          padding: 0,
          minWidth: 0,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: '0.82rem',
            color: isActive ? 'var(--accent-text)' : hovered ? 'var(--text-base)' : 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}
        >
          {host}
        </span>
        <span
          className="mono"
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-dim)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {time}
        </span>
      </button>

      {/* Re-run button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRerun(scan.url); }}
        aria-label={`Re-run scan for ${host}`}
        title="Re-run"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26, height: 26,
          borderRadius: '50%',
          background: hovered ? 'rgba(34,211,238,0.08)' : 'transparent',
          border: `1px solid ${hovered ? 'rgba(34,211,238,0.2)' : 'transparent'}`,
          cursor: 'pointer',
          color: hovered ? 'var(--cyan)' : 'var(--text-dim)',
          opacity: hovered ? 1 : 0.35,
          transition: 'opacity 0.15s, color 0.15s, background 0.15s, border-color 0.15s',
          flexShrink: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RecentScans({ scans, onSelect, onRerun, activeScanId }: RecentScansProps) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [flashId,   setFlashId]   = useState<string | null>(null);
  const [listKey,   setListKey]   = useState(0);

  if (scans.length === 0) return null;

  const latest   = scans[0];
  const latestSt = STATUS[latest.status] ?? STATUS.pending;
  const extra    = scans.length - 1;

  function handleToggle() {
    if (!isOpen) setListKey((k) => k + 1); // re-mount rows → replay stagger animation
    setIsOpen((v) => !v);
  }

  async function handleSelect(scan: Scan) {
    if (scan.id === activeScanId) return;
    setFlashId(scan.id);
    await sleep(180);          // flash duration
    setIsOpen(false);
    await sleep(300);          // wait for collapse animation
    setFlashId(null);
    onSelect(scan);            // fire — intentionally not awaited so UI stays responsive
  }

  return (
    <div
      className="w-full max-w-2xl"
      style={{ animation: 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}
    >
      {/* Outer container — morphs from pill to card */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: isOpen ? '14px' : '100px',
          background: isOpen ? 'var(--navy-card)' : 'rgba(255,255,255,0.025)',
          overflow: 'hidden',
          transition: 'border-radius 0.32s cubic-bezier(0.16,1,0.3,1), background 0.25s, border-color 0.2s',
        }}
      >
        {/* Trigger */}
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls="recent-scans-list"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isOpen ? '0.75rem 1rem 0.75rem 1rem' : '0.38rem 1rem 0.38rem 0.9rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'padding 0.32s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Clock icon */}
          <svg
            width="13" height="13"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: isOpen ? 'var(--accent-text)' : 'var(--text-dim)', flexShrink: 0, transition: 'color 0.2s' }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>

          {/* Label / preview */}
          <span
            className="mono"
            style={{
              flex: 1,
              fontSize: '0.75rem',
              color: isOpen ? 'var(--text-muted)' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflow: 'hidden',
              transition: 'color 0.2s',
            }}
          >
            {isOpen ? (
              `${scans.length} recent scan${scans.length !== 1 ? 's' : ''}`
            ) : (
              <>
                {/* Latest scan's status dot as preview */}
                <span
                  aria-hidden="true"
                  className={latestSt.pulse ? 'animate-pulse' : ''}
                  style={{
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: latestSt.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {domain(latest.url)}
                </span>
                {extra > 0 && (
                  <span style={{ opacity: 0.5, flexShrink: 0 }}>
                    +{extra}
                  </span>
                )}
              </>
            )}
          </span>

          {/* Chevron */}
          <svg
            width="13" height="13"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
            style={{
              color: 'var(--text-dim)',
              flexShrink: 0,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Divider — fades in when open */}
        <div
          aria-hidden="true"
          style={{
            height: '1px',
            background: 'var(--border)',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        />

        {/* List */}
        <div
          id="recent-scans-list"
          role="list"
          aria-label="Recent scans"
          style={{
            maxHeight: isOpen ? `${scans.length * 64}px` : '0',
            opacity: isOpen ? 1 : 0,
            overflow: 'hidden',
            transition: isOpen
              ? 'max-height 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease'
              : 'max-height 0.28s cubic-bezier(0.4,0,0.6,1), opacity 0.16s ease',
          }}
        >
          {scans.map((scan, i) => (
            <ScanRow
              key={`${scan.id}-${listKey}`}
              scan={scan}
              index={i}
              isActive={scan.id === activeScanId}
              isFlashing={scan.id === flashId}
              onSelect={handleSelect}
              onRerun={onRerun}
              isLast={i === scans.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
