import { z } from 'zod';

const inputSchema = z.object({
  ecId: z.string().describe('EC identifier'),
  checkId: z.string().describe('Check ID receiving feedback'),
  action: z.enum(['confirmed', 'override']).describe('Feedback action'),
  reasonCode: z.enum(['too_strict', 'exception', 'data_entry', 'version']).optional(),
  comment: z.string().optional(),
  currentVersion: z.number().describe('Current output version number'),
  checksData: z.array(z.any()).describe('All check results from current version'),
  formVersion: z.string(),
  rulesVersion: z.string(),
});

type Input = z.infer<typeof inputSchema>;

interface Output {
  newVersion: number;
  blobUrl: string;
  updatedCheckId: string;
  action: string;
  success: boolean;
  error?: string;
}

export const feedbackPrompt = `You are the feedback processor for the EC validator.

Your task:
1. Read the current output version
2. Find the check with the specified check_id
3. Apply the feedback action (confirm or override)
4. Update the check's review field
5. If override, set effective_status to DISMISSED
6. Increment the version number
7. Write the new output version to Blob storage
8. Append to the feedback log

Review field structure:
{
  "action": "confirmed" | "override",
  "reason_code": "too_strict" | "exception" | "data_entry" | "version",
  "comment": "reviewer comment",
  "reviewed_at": "ISO timestamp"
}

Return the new version number and Blob URL.`;

export async function feedback(input: Input): Promise<Output> {
  // This is a subagent - it will be called by the orchestrator
  // The actual feedback processing logic will be implemented by Eve
  // This is a TypeScript interface definition for type safety
  
  return {
    newVersion: 0,
    blobUrl: '',
    updatedCheckId: '',
    action: '',
    success: false,
    error: 'Subagent implementation handled by Eve framework',
  };
}

export { inputSchema as schema, feedbackPrompt as instructions };
export default feedback;
