import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';
import { put } from '@vercel/blob';

const CheckResultSchema = z.object({
  check_id: z.string(),
  check_name: z.string(),
  status: z.enum(['PASS', 'FLAG', 'N/A', 'UNVERIFIABLE']),
  found: z.string(),
  expected: z.string(),
  confidence: z.enum(['High', 'Medium', 'Low']),
  note: z.string().optional(),
  rules_version: z.string(),
  highlight_refs: z.array(z.string()),
  review: z.object({
    action: z.enum(['confirmed', 'override']),
    reason_code: z.enum(['too_strict', 'exception', 'data_entry', 'version']).optional(),
    comment: z.string().optional(),
    reviewed_at: z.string().optional(),
  }).optional(),
  effective_status: z.enum(['FLAG', 'DISMISSED']).optional(),
});

const inputSchema = z.object({
  ecId: z.string().describe('EC identifier'),
  formVersion: z.string().describe('Form version from extraction'),
  rulesVersion: z.string().describe('Rules version used'),
  checks: z.array(CheckResultSchema).describe('Array of check results'),
  version: z.number().describe('Output version number'),
});

type Input = z.infer<typeof inputSchema>;

interface Summary {
  checks: number;
  pass: number;
  flag: number;
  na: number;
  unverifiable: number;
  confirmed: number;
  overridden: number;
}

interface Output {
  outputPath: string;
  blobUrl: string;
  version: number;
  summary: Summary;
  success: boolean;
  error?: string;
}

export async function write_output_version(input: Input): Promise<Output> {
  try {
    const { ecId, formVersion, rulesVersion, checks, version } = input;
    
    const summary: Summary = {
      checks: checks.length,
      pass: checks.filter(c => c.status === 'PASS').length,
      flag: checks.filter(c => c.status === 'FLAG').length,
      na: checks.filter(c => c.status === 'N/A').length,
      unverifiable: checks.filter(c => c.status === 'UNVERIFIABLE').length,
      confirmed: checks.filter(c => c.review?.action === 'confirmed').length,
      overridden: checks.filter(c => c.review?.action === 'override').length,
    };
    
    const outputData = {
      output_version: version,
      ec_id: ecId,
      form_version: formVersion,
      rules_version: rulesVersion,
      generated_at: new Date().toISOString(),
      summary,
      checks,
    };
    
    const workingDir = process.env.SANDBOX_WORKING_DIR || '/tmp/ec-validator';
    await fs.mkdir(workingDir, { recursive: true });
    
    const filename = `output_v${version}.json`;
    const localPath = join(workingDir, filename);
    await fs.writeFile(localPath, JSON.stringify(outputData, null, 2));
    
    const blob = await put(`ec/${ecId}/${filename}`, JSON.stringify(outputData), {
      access: 'public',
      addRandomSuffix: false,
    });
    
    return {
      outputPath: localPath,
      blobUrl: blob.url,
      version,
      summary,
      success: true,
    };
  } catch (error) {
    return {
      outputPath: '',
      blobUrl: '',
      version: 0,
      summary: { checks: 0, pass: 0, flag: 0, na: 0, unverifiable: 0, confirmed: 0, overridden: 0 },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export { inputSchema as schema };
export default write_output_version;
