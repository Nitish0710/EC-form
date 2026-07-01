export interface Check {
  check_id: string;
  check_name: string;
  status: 'PASS' | 'FLAG' | 'N/A' | 'UNVERIFIABLE';
  found: string;
  expected: string;
  confidence: 'High' | 'Medium' | 'Low';
  note?: string;
  rules_version: string;
  highlight_refs: string[];
  review?: {
    action: 'confirmed' | 'override';
    reason_code?: string;
    comment?: string;
    reviewed_at?: string;
  };
  effective_status?: 'FLAG' | 'DISMISSED';
}

export interface VersionedOutput {
  schema_version: '1.0';
  version: number;
  ec_id: string | null;
  form_version: string;
  generated_at: string;
  extraction_confidence: number;
  summary: {
    total: number;
    pass: number;
    flag: number;
    na: number;
    unverifiable: number;
    overrides: number;
    confirmed: number;
  };
  checks: Check[];
}

export interface HistoryEntry {
  id: string;
  filename: string;
  validated_at: string;
  form_version: string;
  extraction_confidence: number;
  summary: VersionedOutput['summary'];
  versions: VersionedOutput[];
  pdfUrl?: string;
}
