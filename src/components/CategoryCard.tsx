import type { Assessment } from '../types/scanner';
import { ScoreRing } from './ScoreRing';

interface CategoryCardProps {
  id: string;
  name: string;
  assessments: Assessment[];
}

export function categoryScore(assessments: Assessment[]): {
  score: number;
  passed: number;
  total: number;
} {
  const relevant = assessments.filter((a) => a.status !== 'skipped');
  const passed = relevant.filter((a) => a.findings.length === 0 && a.status === 'completed').length;
  const score = relevant.length > 0 ? Math.round((passed / relevant.length) * 100) : 100;
  return { score, passed, total: relevant.length };
}

export function CategoryCard({ name, assessments }: CategoryCardProps) {
  const { score, passed, total } = categoryScore(assessments);

  return (
    <article
      className="rounded-2xl p-5 flex items-center gap-4 transition-colors"
      style={{ background: 'var(--navy-card)', border: '1px solid var(--border)' }}
      aria-label={`${name} score: ${score}`}
    >
      <ScoreRing score={score} />
      <div>
        <h3
          className="font-medium text-sm"
          style={{ color: 'var(--text-base)' }}
        >
          {name}
        </h3>
        <p
          className="mono text-xs mt-0.5"
          style={{ color: 'var(--text-dim)' }}
        >
          {passed} / {total} passed
        </p>
      </div>
    </article>
  );
}
