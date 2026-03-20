import type { Finding } from '../types/scanner';

interface FindingItemProps {
  finding: Finding;
}

export function FindingItem({ finding }: FindingItemProps) {
  const detailEntries = Object.entries(finding.details ?? {});

  return (
    <li className="rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
      <p className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
        {finding.identifier}
      </p>
      {detailEntries.length > 0 && (
        <dl className="space-y-1">
          {detailEntries.map(([key, value]) => (
            <div key={key} className="flex gap-2 text-sm">
              <dt className="text-gray-500 dark:text-gray-400 shrink-0 capitalize">{key.replace(/_/g, ' ')}:</dt>
              <dd className="text-gray-700 dark:text-gray-200 font-mono break-all">
                {typeof value === 'string' ? value : JSON.stringify(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}
