import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';

const inputSchema = z.object({
  blobUrl: z.string().url().describe('Vercel Blob URL of the uploaded PDF'),
  ecId: z.string().describe('EC identifier for file naming'),
});

type Input = z.infer<typeof inputSchema>;

interface Output {
  localPath: string;
  fileSize: number;
  success: boolean;
  error?: string;
}

export async function fetch_pdf(input: Input): Promise<Output> {
  try {
    const { blobUrl, ecId } = input;
    
    const response = await fetch(blobUrl);
    
    if (!response.ok) {
      return {
        localPath: '',
        fileSize: 0,
        success: false,
        error: `Failed to fetch PDF: ${response.statusText}`,
      };
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const workingDir = process.env.SANDBOX_WORKING_DIR || '/tmp/ec-validator';
    await fs.mkdir(workingDir, { recursive: true });
    
    const localPath = join(workingDir, `${ecId}.pdf`);
    await fs.writeFile(localPath, buffer);
    
    return {
      localPath,
      fileSize: buffer.length,
      success: true,
    };
  } catch (error) {
    return {
      localPath: '',
      fileSize: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export { inputSchema as schema };
export default fetch_pdf;
