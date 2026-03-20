export type ScanStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'completed_with_errors'
  | 'failed';

export type AssessmentStatus = 'completed' | 'failed' | 'skipped';

export interface Finding {
  id: string;
  identifier: string;
  details: Record<string, unknown>;
}

export interface Assessment {
  id: string;
  identifier: string;
  status: AssessmentStatus;
  details: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  findings: Finding[];
}

export interface Scan {
  id: string;
  url: string;
  status: ScanStatus;
  details: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  assessments: Assessment[];
}
