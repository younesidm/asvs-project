export interface Requirement {
  chapter: string;
  code: string;
  area?: string;
  level?: string;
  cwe?: string;
  requirement: string;

  // AI explanation
  explanation?: string;
  example?: string;
  implementation?: string;
  riskLevel?: string;
  showExplanation?: boolean;
  loading?: boolean;

  // Compliance status
  status?: 'pass' | 'fail' | null;
}
