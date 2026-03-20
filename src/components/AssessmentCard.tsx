import { useState } from 'react';
import type { Assessment } from '../types/scanner';
import { FindingItem } from './FindingItem';

interface AssessmentCardProps {
  assessment: Assessment;
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  skipped: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const [open, setOpen] = useState(assessment.findings.length > 0);
  const hasFlaw = assessment.findings.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[assessment.status] ?? ''}`}
          >
            {assessment.status}
          </span>
          <span className="font-mono text-sm text-white">{assessment.identifier}</span>
        </div>
        <div className="flex items-center gap-3">
          {hasFlaw && (
            <span className="text-xs text-amber-400 font-medium">
              {assessment.findings.length} finding{assessment.findings.length !== 1 ? 's' : ''}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4">
          {hasFlaw ? (
            <ul className="space-y-2" aria-label="Findings">
              {assessment.findings.map((finding) => (
                <FindingItem key={finding.id} finding={finding} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No issues found.</p>
          )}
        </div>
      )}
    </div>
  );
}
