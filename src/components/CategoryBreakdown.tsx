import type { Assessment } from '../types/scanner';

interface CategoryScore {
  key: string;
  label: string;
  icon: string;
  score: number | null;
  color: string;
  bg: string;
}

interface CategoryBreakdownProps {
  assessments: Assessment[];
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  accessibility: {
    label: 'Accessibility',
    icon: '♿',
    color: 'var(--eaa-purple)',
    bg: 'var(--eaa-purple-bg)',
  },
  performance: {
    label: 'Performance',
    icon: '⚡',
    color: 'var(--eaa-blue)',
    bg: 'var(--eaa-blue-bg)',
  },
  sustainability: {
    label: 'Sustainability',
    icon: '🌱',
    color: 'var(--eaa-green)',
    bg: 'var(--eaa-green-bg)',
  },
  security: {
    label: 'Security',
    icon: '🔒',
    color: 'var(--eaa-red)',
    bg: 'var(--eaa-red-bg)',
  },
  seo: {
    label: 'SEO',
    icon: '🔍',
    color: 'var(--eaa-amber)',
    bg: 'var(--eaa-amber-bg)',
  },
};

function getCategoryScoreColor(score: number | null): string {
  if (score === null) return 'var(--text-dim)';
  if (score >= 90) return 'var(--score-good)';
  if (score >= 70) return 'var(--score-ok)';
  return 'var(--score-bad)';
}

function getCategoryScoreBg(score: number | null): string {
  if (score === null) return 'var(--navy-mid)';
  if (score >= 90) return 'var(--eaa-green-bg)';
  if (score >= 70) return 'var(--eaa-amber-bg)';
  return 'var(--eaa-red-bg)';
}

function getLetterGrade(score: number | null): string {
  if (score === null) return '-';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function normalizeScore(assessments: Assessment[]): number | null {
  const scores = assessments
    .filter((a) => a.status === 'completed' && typeof a.details?.score_percent === 'number')
    .map((a) => a.details!.score_percent as number);
  if (scores.length === 0) {
    return null;
  }
  return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
}

function getCategoryKey(assessment: Assessment): string {
  return assessment.category ?? assessment.identifier.split('-')[0].toLowerCase();
}

export function CategoryBreakdown({ assessments }: CategoryBreakdownProps) {
  const relevant = assessments.filter((a) => a.status !== 'skipped' && a.identifier !== 'http-fetch');

  const byCategory = new Map<string, Assessment[]>();
  for (const a of relevant) {
    const key = getCategoryKey(a);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(a);
  }

  const categories: CategoryScore[] = [...byCategory.entries()].filter(([, asmts]) => normalizeScore(asmts) !== null).map(([key, asmts]) => {
    const meta = CATEGORY_META[key] ?? {
      label: key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: '📋',
      color: 'var(--eaa-teal)',
      bg: 'var(--eaa-teal-bg)',
    };
    return {
      key,
      label: meta.label,
      icon: meta.icon,
      score: normalizeScore(asmts),
      color: meta.color,
      bg: meta.bg,
    };
  });

  if (categories.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--navy-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '1.25rem',
      }}
    >
      <h2
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-dim)',
          margin: 0,
          marginBottom: '1rem',
          font: 'inherit',
        }}
      >
        Scores by category
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.map((cat) => (
          <div
            key={cat.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0.6rem 0.8rem',
              background: 'var(--navy-mid)',
              borderRadius: 10,
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-base)' }}>
                {cat.label}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 28,
                  borderRadius: 6,
                  background: getCategoryScoreBg(cat.score),
                  border: `1px solid ${getCategoryScoreColor(cat.score)}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: getCategoryScoreColor(cat.score),
                }}
              >
                {getLetterGrade(cat.score)}
              </div>
              <div
                role="progressbar"
                aria-valuenow={cat.score ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cat.label} score`}
                style={{
                  width: 60,
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: cat.score !== null ? `${cat.score}%` : '0%',
                    height: '100%',
                    borderRadius: 3,
                    background: getCategoryScoreColor(cat.score),
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.78rem',
                  color: getCategoryScoreColor(cat.score),
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {cat.score !== null ? `${cat.score}%` : '-'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
