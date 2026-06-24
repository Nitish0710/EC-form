import { NextRequest, NextResponse } from 'next/server';

interface FeedbackRequest {
  ecId: string;
  checkId: string;
  action: 'confirmed' | 'override';
  reasonCode?: 'too_strict' | 'exception' | 'data_entry' | 'version';
  comment?: string;
  currentVersion: number;
}

interface FeedbackResponse {
  success: boolean;
  ecId: string;
  checkId: string;
  action: string;
  newVersion: number;
  downloadUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { ecId, checkId, action, reasonCode, comment, currentVersion } = body;

    if (!ecId || !checkId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: ecId, checkId, or action' },
        { status: 400 }
      );
    }

    if (action === 'override' && !reasonCode) {
      return NextResponse.json(
        { success: false, error: 'reasonCode is required for override action' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Eve agent integration
    // For now, this is a mock implementation showing the structure
    
    console.log(`[Feedback] Processing ${action} for check ${checkId} on EC ${ecId}`);
    
    // Step 1: Resume the parked Eve agent
    console.log(`[Feedback] Resuming agent for EC ${ecId}`);
    
    // Step 2: Call feedback subagent
    console.log(`[Feedback] Applying feedback action`);
    const feedbackResult = await mockFeedbackProcessing({
      ecId,
      checkId,
      action,
      reasonCode,
      comment,
      currentVersion,
    });
    
    // Step 3: Generate new output version
    console.log(`[Feedback] Generated output_v${feedbackResult.newVersion}.json`);
    
    // Step 4: Append to feedback log
    console.log(`[Feedback] Appended to feedback-log.json`);
    
    // Step 5: Return new version info
    const response: FeedbackResponse = {
      success: true,
      ecId,
      checkId,
      action,
      newVersion: feedbackResult.newVersion,
      downloadUrl: feedbackResult.downloadUrl,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Feedback] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Mock function - will be replaced with actual Eve agent calls

async function mockFeedbackProcessing(feedback: FeedbackRequest) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newVersion = feedback.currentVersion + 1;
  
  return {
    newVersion,
    downloadUrl: `https://blob.vercel-storage.com/ec/${feedback.ecId}/output_v${newVersion}.json`,
    timestamp: new Date().toISOString(),
  };
}
