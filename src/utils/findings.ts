import type { Assessment, Finding } from '../types/scanner';

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
