import type { Assessment } from '../types/scanner';
import { ScoreRing } from './ScoreRing';

interface CategoryCardProps {
  id: string;
  name: string;
  assessments: Assessment[];
}

function categoryScore(assessments: Assessment[]): {
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
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 flex items-center gap-4"
      aria-label={`${name} score: ${score}`}
    >
      <ScoreRing score={score} />
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-base">{name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{passed} / {total} checks passed</p>
      </div>
    </article>
  );
}
