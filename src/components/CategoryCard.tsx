import type { Category } from '../data/mockScores';
import { ScoreRing } from './ScoreRing';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const passed = category.subcategories.filter((s) => s.passed).length;
  const total = category.subcategories.length;

  return (
    <article
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 flex flex-col gap-4"
      aria-label={`${category.name} score: ${category.score}`}
    >
      <div className="flex items-center gap-4">
        <ScoreRing score={category.score} />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">
            {category.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {passed} / {total} checks passed
          </p>
        </div>
      </div>

      <ul className="space-y-1.5" aria-label={`${category.name} checks`}>
        {category.subcategories.map((sub) => (
          <li key={sub.name} className="flex items-center gap-2 text-sm">
            {sub.passed ? (
              <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={sub.passed ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}>
              {sub.name}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
