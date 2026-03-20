import { mockCategories } from '../data/mockScores';
import { CategoryCard } from './CategoryCard';
import { ScoreRing } from './ScoreRing';

export function ScoreDashboard() {
  const overallScore = Math.round(
    mockCategories.reduce((sum, c) => sum + c.score, 0) / mockCategories.length
  );

  return (
    <section className="w-full max-w-4xl space-y-6" aria-label="Scan score dashboard">

      {/* Prototype badge */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-mono break-all">https://example.com</p>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Prototype — mock data
        </span>
      </div>

      {/* Overall score */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 flex items-center gap-6">
        <ScoreRing score={overallScore} size={104} />
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Overall Score</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {overallScore >= 90
              ? 'Excellent — this site is in great shape.'
              : overallScore >= 50
              ? 'Some issues found — there is room for improvement.'
              : 'Critical issues detected — action recommended.'}
          </p>
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
