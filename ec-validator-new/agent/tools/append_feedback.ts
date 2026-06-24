import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';

const inputSchema = z.object({
  ecId: z.string().describe('EC identifier'),
  checkId: z.string().describe('Check ID that received feedback'),
  action: z.enum(['confirmed', 'override']).describe('Feedback action'),
  reasonCode: z.enum(['too_strict', 'exception', 'data_entry', 'version']).optional().describe('Reason code for override'),
  comment: z.string().optional().describe('Reviewer comment'),
  fromVersion: z.number().describe('Output version before feedback'),
  toVersion: z.number().describe('Output version after feedback'),
  rulesVersion: z.string().describe('Rules version'),
});

type Input = z.infer<typeof inputSchema>;

interface FeedbackEntry {
  timestamp: string;
  ec_id: string;
  check_id: string;
  action: string;
  reason_code?: string;
  comment?: string;
  from_version: number;
  to_version: number;
  rules_version: string;
}

interface Output {
  logPath: string;
  entryCount: number;
  success: boolean;
  error?: string;
}

export async function append_feedback(input: Input): Promise<Output> {
  try {
    const {
      ecId,
      checkId,
      action,
      reasonCode,
      comment,
      fromVersion,
      toVersion,
      rulesVersion,
    } = input;
    
    const workingDir = process.env.SANDBOX_WORKING_DIR || '/tmp/ec-validator';
    await fs.mkdir(workingDir, { recursive: true });
    
    const logPath = join(workingDir, 'feedback-log.json');
    
    let entries: FeedbackEntry[] = [];
    try {
      const existingData = await fs.readFile(logPath, 'utf-8');
      entries = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet, start with empty array
    }
    
    const newEntry: FeedbackEntry = {
      timestamp: new Date().toISOString(),
      ec_id: ecId,
      check_id: checkId,
      action,
      reason_code: reasonCode,
      comment,
      from_version: fromVersion,
      to_version: toVersion,
      rules_version: rulesVersion,
    };
    
    entries.push(newEntry);
    
    await fs.writeFile(logPath, JSON.stringify(entries, null, 2));
    
    return {
      logPath,
      entryCount: entries.length,
      success: true,
    };
  } catch (error) {
    return {
      logPath: '',
      entryCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export { inputSchema as schema };
export default append_feedback;
