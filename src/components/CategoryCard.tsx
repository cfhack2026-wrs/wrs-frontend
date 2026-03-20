import type { Category } from '../data/mockScores';
import { ScoreRing } from './ScoreRing';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const violations = category.subcategories.filter((s) => !s.passed);
  const passed = category.subcategories.filter((s) => s.passed);

  return (
    <article
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 flex flex-col gap-5"
      aria-label={`${category.name} score: ${category.score}`}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <ScoreRing score={category.score} />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">
            {category.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {passed.length} / {category.subcategories.length} checks passed
          </p>
        </div>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-red-500 font-semibold">
            Violations
          </h4>
          <ul className="space-y-3" aria-label={`${category.name} violations`}>
            {violations.map((sub) => (
              <li key={sub.name} className="rounded-xl bg-red-500/5 border border-red-500/15 p-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{sub.name}</span>
                </div>
                {sub.fixSuggestion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-6">
                    {sub.fixSuggestion}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Passed checks */}
      {passed.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-green-600 dark:text-green-500 font-semibold">
            Passed
          </h4>
          <ul className="space-y-1.5" aria-label={`${category.name} passed checks`}>
            {passed.map((sub) => (
              <li key={sub.name} className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">{sub.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
