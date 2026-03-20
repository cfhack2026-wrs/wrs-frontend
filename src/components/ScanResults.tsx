import type { Scan } from '../types/scanner';
import { AssessmentCard } from './AssessmentCard';

interface ScanResultsProps {
  scan: Scan;
  onReset: () => void;
}

export function ScanResults({ scan, onReset }: ScanResultsProps) {
  const totalFindings = scan.assessments.reduce((n, a) => n + a.findings.length, 0);
  const assessmentsWithFindings = scan.assessments.filter((a) => a.findings.length > 0);
  const cleanAssessments = scan.assessments.filter((a) => a.findings.length === 0 && a.status === 'completed');

  return (
    <section className="w-full max-w-3xl space-y-6" aria-label="Scan results">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">{scan.url}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
            {totalFindings === 0
              ? 'No issues found — great job!'
              : `${totalFindings} issue${totalFindings !== 1 ? 's' : ''} across ${assessmentsWithFindings.length} check${assessmentsWithFindings.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-200 dark:border-white/20 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          New scan
        </button>
      </div>

      {/* Issues first */}
      {assessmentsWithFindings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Issues</h2>
          <div className="space-y-2">
            {assessmentsWithFindings.map((a) => (
              <AssessmentCard key={a.id} assessment={a} />
            ))}
          </div>
        </div>
      )}

      {/* Clean checks */}
      {cleanAssessments.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Passed</h2>
          <div className="space-y-2">
            {cleanAssessments.map((a) => (
              <AssessmentCard key={a.id} assessment={a} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
