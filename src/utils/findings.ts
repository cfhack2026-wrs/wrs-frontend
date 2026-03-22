import type { Assessment, Finding } from '../types/scanner';

const SPACE_SAVING_PATTERNS = [
  'cache',
  'compression',
  'optimized',
  'webp',
  'avif',
  'unminified',
  'unused',
  'efficiently',
  'byte-weight',
  'network',
  'third-party',
  'font',
  'image',
  'stylesheet',
  'script',
  'payload',
  'large',
];

const PERFORMANCE_IDENTIFIERS = [
  'performance',
  'lighthouse',
  'speed',
];

const SUSTAINABILITY_IDENTIFIERS = [
  'sustainability',
  'carbon',
  'green',
  'eco',
];

function isSpaceSavingFinding(identifier: string): boolean {
  const lower = identifier.toLowerCase();
  return SPACE_SAVING_PATTERNS.some((p) => lower.includes(p));
}

function isPerformanceAssessment(assessment: Assessment): boolean {
  const identifier = assessment.identifier.toLowerCase();
  const category = (assessment.category ?? '').toLowerCase();
  return PERFORMANCE_IDENTIFIERS.some((p) => identifier.includes(p) || category.includes(p));
}

function isSustainabilityAssessment(assessment: Assessment): boolean {
  const identifier = assessment.identifier.toLowerCase();
  const category = (assessment.category ?? '').toLowerCase();
  return SUSTAINABILITY_IDENTIFIERS.some((s) => identifier.includes(s) || category.includes(s));
}

function createDuplicatedFinding(finding: Finding, sourceAssessment: Assessment): Finding {
  return {
    ...finding,
    id: `${finding.id}-sustainability-duplicate`,
    identifier: finding.identifier,
    details: {
      ...finding.details,
      duplicated_from: sourceAssessment.identifier,
      sustainability_note: 'This finding was originally detected in the Performance category. Reducing resource size also decreases energy consumption and CO₂ emissions, making it relevant for sustainability.',
    },
  };
}

export function enrichForSustainability(assessments: Assessment[]): Assessment[] {
  const sustainabilityAssessments = assessments.filter(isSustainabilityAssessment);
  const performanceAssessments = assessments.filter(isPerformanceAssessment);

  if (sustainabilityAssessments.length === 0 || performanceAssessments.length === 0) {
    return assessments;
  }

  const existingIdentifiers = new Set<string>();
  for (const sustA of sustainabilityAssessments) {
    for (const f of sustA.findings) {
      existingIdentifiers.add(f.identifier);
    }
  }

  const newFindings: Finding[] = [];
  for (const perfAssessment of performanceAssessments) {
    for (const finding of perfAssessment.findings) {
      if (isSpaceSavingFinding(finding.identifier) && !existingIdentifiers.has(finding.identifier)) {
        newFindings.push(createDuplicatedFinding(finding, perfAssessment));
        existingIdentifiers.add(finding.identifier);
      }
    }
  }

  if (newFindings.length === 0) return assessments;

  return assessments.map((a) => {
    if (isSustainabilityAssessment(a)) {
      return {
        ...a,
        findings: [...a.findings, ...newFindings],
      };
    }
    return a;
  });
}

/**
 * Merges findings from multiple assessments in the same category, deduplicating
 * by finding identifier. Axe findings are processed first because they carry
 * richer data (impact, nodes, tags, help_url). Findings from other tools are
 * appended only if their identifier hasn't already been seen.
 */
export function mergeFindings(assessments: Assessment[]): Finding[] {
  const seen = new Map<string, Finding>();

  // Axe first — has impact/nodes/tags/help_url
  for (const a of assessments) {
    if (a.identifier === 'axe') {
      for (const f of a.findings) seen.set(f.identifier, f);
    }
  }

  // All other assessments: only add identifiers not already present
  for (const a of assessments) {
    if (a.identifier !== 'axe') {
      for (const f of a.findings) {
        if (!seen.has(f.identifier)) seen.set(f.identifier, f);
      }
    }
  }

  return [...seen.values()];
}
