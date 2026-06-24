import { z } from 'zod';

const inputSchema = z.object({
  extractionData: z.object({
    form_version: z.string(),
    extraction_confidence: z.number(),
    fields: z.record(z.any()),
  }).describe('Extraction data from the extractor subagent'),
});

type Input = z.infer<typeof inputSchema>;

interface CheckResult {
  check_id: string;
  check_name: string;
  status: 'PASS' | 'FLAG' | 'N/A' | 'UNVERIFIABLE';
  found: string;
  expected: string;
  confidence: 'High' | 'Medium' | 'Low';
  note?: string;
  rules_version: string;
  highlight_refs: string[];
}

interface Output {
  checks: CheckResult[];
  totalChecks: number;
  flagCount: number;
  passCount: number;
  naCount: number;
  success: boolean;
  error?: string;
}

export const validatorPrompt = `You are a FEMA Elevation Certificate validator.

Your task:
1. Load the completeness-checklist skill
2. Load the fema-rules skill
3. Apply all validation rules to the extraction data
4. For each rule, produce a CheckResult object
5. Stream results as they are generated

Important:
- Apply completeness checks first (all required fields present?)
- Then apply semantic validation rules (values correct, consistent, compliant?)
- Use the field bounding boxes for highlight_refs
- Set appropriate confidence levels
- Include clear explanations in found/expected fields

Rules to apply:
- Pre-processing (P1-P2): confidence gate, form version
- Section A checks: address, lat/long, diagram vision match
- Section B checks: zone, BFE, datum, LiMWA
- Section C checks: elevations, datum consistency, C2c conditional
- Section D checks: certifier, comments completeness
- Cross-field checks (X2-X5): freeboard, LAG/HAG, multi-story logic

Return an array of CheckResult objects.`;

export async function validator(input: Input): Promise<Output> {
  // This is a subagent - it will be called by the orchestrator
  // The actual validation logic will be implemented by Eve's skill system
  // This is a TypeScript interface definition for type safety
  
  return {
    checks: [],
    totalChecks: 0,
    flagCount: 0,
    passCount: 0,
    naCount: 0,
    success: false,
    error: 'Subagent implementation handled by Eve framework',
  };
}

export { inputSchema as schema, validatorPrompt as instructions };
export default validator;
