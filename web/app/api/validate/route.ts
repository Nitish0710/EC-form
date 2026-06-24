import { NextRequest, NextResponse } from 'next/server';

interface ValidateRequest {
  blobUrl: string;
  ecId: string;
  buildingPhotos?: string[];
}

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

interface ValidationResponse {
  success: boolean;
  ecId: string;
  formVersion?: string;
  extractionConfidence?: number;
  checks?: CheckResult[];
  outputVersion: number;
  downloadUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json();
    const { blobUrl, ecId, buildingPhotos = [] } = body;

    if (!blobUrl || !ecId) {
      return NextResponse.json(
        { success: false, error: 'Missing blobUrl or ecId' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Eve agent integration
    // For now, this is a mock implementation showing the structure
    
    // Step 1: Fetch PDF from Blob
    console.log(`[Validate] Fetching PDF from ${blobUrl}`);
    
    // Step 2: Extract fields using extractor subagent
    console.log(`[Validate] Extracting fields for EC ${ecId}`);
    const extractionResult = await mockExtraction(blobUrl, ecId);
    
    // Step 3: Version gate - check form version
    console.log(`[Validate] Checking form version: ${extractionResult.formVersion}`);
    if (extractionResult.formVersion !== 'FF-206-FY-22-152') {
      return NextResponse.json({
        success: false,
        ecId,
        formVersion: extractionResult.formVersion,
        error: `Form version ${extractionResult.formVersion} is not supported. Only FF-206-FY-22-152 is supported in this POC.`,
      }, { status: 400 });
    }
    
    // Step 4: Validate using validator subagent
    console.log(`[Validate] Running validation rules`);
    const validationResult = await mockValidation(extractionResult);
    
    // Step 5: Write output_v1.json
    console.log(`[Validate] Writing output_v1.json`);
    const outputUrl = await mockWriteOutput(ecId, extractionResult, validationResult);
    
    // Step 6: Return results
    const response: ValidationResponse = {
      success: true,
      ecId,
      formVersion: extractionResult.formVersion,
      extractionConfidence: extractionResult.confidence,
      checks: validationResult.checks,
      outputVersion: 1,
      downloadUrl: outputUrl,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Validate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Mock functions - will be replaced with actual Eve agent calls

async function mockExtraction(blobUrl: string, ecId: string) {
  // Simulate extraction delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    formVersion: 'FF-206-FY-22-152',
    confidence: 0.94,
    fields: {
      A1: { value: 'Sample Owner', confidence: 0.97, bbox: { page: 1, x: 0.1, y: 0.18, w: 0.42, h: 0.03 } },
      B8: { value: 'VE', confidence: 0.96, bbox: { page: 1, x: 0.55, y: 0.41, w: 0.12, h: 0.03 } },
      B9: { value: '12.00', unit: 'ft', datum: 'NAVD 88', confidence: 0.95, bbox: { page: 1, x: 0.7, y: 0.41, w: 0.18, h: 0.03 } },
      'C2a': { value: '11.20', unit: 'ft', datum: 'NAVD 88', confidence: 0.95, bbox: { page: 2, x: 0.12, y: 0.34, w: 0.3, h: 0.03 } },
    },
  };
}

async function mockValidation(extractionResult: any) {
  // Simulate validation delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const checks: CheckResult[] = [
    {
      check_id: 'P2',
      check_name: 'Form Version',
      status: 'PASS',
      found: 'FF-206-FY-22-152 (Oct 2022)',
      expected: 'Current FEMA form version',
      confidence: 'High',
      rules_version: 'v1',
      highlight_refs: [],
    },
    {
      check_id: 'A1',
      check_name: 'Building Owner Name',
      status: 'PASS',
      found: 'Sample Owner',
      expected: 'Required field',
      confidence: 'High',
      rules_version: 'v1',
      highlight_refs: ['A1'],
    },
    {
      check_id: 'X3',
      check_name: 'Freeboard Check — Lowest Floor vs BFE',
      status: 'FLAG',
      found: 'C2.a = 11.20 ft, BFE (B9) = 12.00 ft — 0.80 ft below BFE',
      expected: 'C2.a at or above B9 (same datum, NAVD 88) per NFIP compliance',
      confidence: 'High',
      note: 'Arithmetic cross-check; both NAVD 88. Margin = C2.a − B9 = −0.80 ft.',
      rules_version: 'v1',
      highlight_refs: ['C2a', 'B9'],
    },
  ];

  return {
    checks,
    totalChecks: checks.length,
    flagCount: checks.filter(c => c.status === 'FLAG').length,
    passCount: checks.filter(c => c.status === 'PASS').length,
    naCount: checks.filter(c => c.status === 'N/A').length,
  };
}

async function mockWriteOutput(ecId: string, extractionResult: any, validationResult: any) {
  // Simulate writing to Blob
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production, this would upload to Vercel Blob and return the URL
  return `https://blob.vercel-storage.com/ec/${ecId}/output_v1.json`;
}
