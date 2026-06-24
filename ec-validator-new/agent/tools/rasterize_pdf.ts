import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

const inputSchema = z.object({
  pdfPath: z.string().describe('Local path to PDF file'),
  dpi: z.number().default(150).describe('DPI for rasterization (default: 150)'),
});

type Input = z.infer<typeof inputSchema>;

interface PageImage {
  page: number;
  path: string;
  width: number;
  height: number;
}

interface Output {
  pageImages: PageImage[];
  totalPages: number;
  success: boolean;
  error?: string;
}

export async function rasterize_pdf(input: Input): Promise<Output> {
  try {
    const { pdfPath, dpi } = input;
    
    const pdfData = await fs.readFile(pdfPath);
    
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    const totalPages = pdf.numPages;
    const pageImages: PageImage[] = [];
    
    const workingDir = process.env.SANDBOX_WORKING_DIR || '/tmp/ec-validator';
    const imagesDir = join(workingDir, 'pages');
    await fs.mkdir(imagesDir, { recursive: true });
    
    const scale = dpi / 72;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context as any,
        viewport,
      }).promise;
      
      const imagePath = join(imagesDir, `page_${pageNum}.png`);
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(imagePath, buffer);
      
      pageImages.push({
        page: pageNum,
        path: imagePath,
        width: viewport.width,
        height: viewport.height,
      });
    }
    
    return {
      pageImages,
      totalPages,
      success: true,
    };
  } catch (error) {
    return {
      pageImages: [],
      totalPages: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export { inputSchema as schema };
export default rasterize_pdf;
