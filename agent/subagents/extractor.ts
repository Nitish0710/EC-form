import { z } from 'zod';

const inputSchema = z.object({
  pageImages: z.array(z.object({
    page: z.number(),
    path: z.string(),
    width: z.number(),
    height: z.number(),
  })).describe('Array of rasterized PDF page images'),
  buildingPhotos: z.array(z.string()).optional().describe('Paths to building photos (if available)'),
});

type Input = z.infer<typeof inputSchema>;

interface FieldValue {
  value: string | number | null;
  confidence: number;
  bbox: {
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  unit?: string;
  datum?: string;
  entered?: string;
  vision_match?: string;
  vision_confidence?: string;
  basis?: string;
}

interface Output {
  form_version: string;
  extraction_confidence: number;
  fields: Record<string, FieldValue>;
  success: boolean;
  error?: string;
}

export const extractorPrompt = `You are an expert at extracting data from FEMA Elevation Certificate forms.

Your task:
1. Analyze the provided PDF page images
2. Extract all field values from the form (Sections A-I)
3. For each field, provide the value, confidence score (0-1), and bounding box
4. Bounding boxes should be normalized (0-1) relative to page dimensions
5. For building diagram (A7), if building photos are provided, use vision analysis to compare the stated diagram vs. photo evidence

Important field mappings:
- Section A: Property Information (A1-A10)
- Section B: Flood Map Information (B1-B13)
- Section C: Building Elevation (C1, C2a-h)
- Section D: Certifier Info (D1-D3)
- Section E: Alternative zones (E1-E4)
- Sections F-I: Additional information

Return the extraction in the specified JSON format with all fields, their values, confidence scores, and bounding boxes.`;

export async function extractor(input: Input): Promise<Output> {
  // This is a subagent - it will be called by the orchestrator
  // The actual VLM-based extraction logic will be implemented by Eve's vision model
  // This is a TypeScript interface definition for type safety
  
  return {
    form_version: '',
    extraction_confidence: 0,
    fields: {},
    success: false,
    error: 'Subagent implementation handled by Eve framework',
  };
}

export { inputSchema as schema, extractorPrompt as instructions };
export default extractor;
