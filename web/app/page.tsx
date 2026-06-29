'use client';

import { useState } from 'react';
import PdfPanel from '@/components/PdfPanel';
import ResultsPanel from '@/components/ResultsPanel';
import { uploadToBlob, generateEcId, validateEcFile } from '@/lib/blob-utils';

interface Check {
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

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [ecId, setEcId] = useState<string | null>(null);
  const [extractionData, setExtractionData] = useState<any>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [outputVersion, setOutputVersion] = useState(1);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [highlightRefs, setHighlightRefs] = useState<string[]>([]);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setIsUploading(true);
      
      // Validate file
      validateEcFile(file);
      
      // Generate EC ID
      const newEcId = generateEcId(file.name);
      setEcId(newEcId);
      
      // Set local object URL for the PDF viewer
      const localUrl = URL.createObjectURL(file);
      setPdfUrl(localUrl);
      setIsUploading(false);

      // Convert file to base64 in chunks to avoid call stack overflow on large files
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      await handleValidation(base64, newEcId);
      
    } catch (err) {
      console.error('[Upload] Error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleValidation = async (pdfBase64: string, ecIdValue: string) => {
    try {
      setIsValidating(true);
      setError(null);

      console.log('[Validate] Starting validation...');
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          ecId: ecIdValue,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Validation failed');
      }
      
      const result = await response.json();
      console.log('[Validate] Validation complete:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Validation failed');
      }
      
      // Update state with results
      setExtractionData(result.extractionData || { fields: {} });
      setChecks(result.checks || []);
      setOutputVersion(result.outputVersion);
      setDownloadUrl(result.downloadUrl || null);
      setIsValidating(false);
      
    } catch (err) {
      console.error('[Validate] Error:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
      setIsValidating(false);
    }
  };

  const handleFeedback = async (
    checkId: string,
    action: 'confirmed' | 'override',
    reasonCode?: string,
    comment?: string
  ) => {
    try {
      setIsProcessingFeedback(true);
      setError(null);
      
      console.log('[Feedback] Submitting feedback:', { checkId, action, reasonCode, comment });
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecId,
          checkId,
          action,
          reasonCode,
          comment,
          currentVersion: outputVersion,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Feedback processing failed');
      }
      
      const result = await response.json();
      console.log('[Feedback] Feedback processed:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Feedback processing failed');
      }
      
      // Update the check in the local state
      setChecks(prevChecks => 
        prevChecks.map(check => {
          if (check.check_id === checkId) {
            return {
              ...check,
              review: {
                action,
                reason_code: reasonCode,
                comment,
                reviewed_at: new Date().toISOString(),
              },
              effective_status: action === 'override' ? 'DISMISSED' : 'FLAG',
            };
          }
          return check;
        })
      );
      
      // Update version and download URL
      setOutputVersion(result.newVersion);
      setDownloadUrl(result.downloadUrl || null);
      setIsProcessingFeedback(false);
      
    } catch (err) {
      console.error('[Feedback] Error:', err);
      setError(err instanceof Error ? err.message : 'Feedback processing failed');
      setIsProcessingFeedback(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[50px] bg-gray-900 flex items-center px-4 gap-3 z-50 border-b border-white/10">
        <div className="font-mono text-sm font-semibold tracking-wider text-white uppercase">
          EC<span className="text-teal-500">.</span>Validator
        </div>
        <div className="w-px h-5 bg-white/20"></div>
        <div className="flex-1 font-mono text-xs text-white/60 truncate">
          {isUploading && 'Uploading...'}
          {isValidating && 'Validating...'}
          {!isUploading && !isValidating && pdfUrl && `EC ID: ${ecId}`}
          {!isUploading && !isValidating && !pdfUrl && 'No document'}
        </div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="text-xs font-mono text-white/50 border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition"
          >
            Download v{outputVersion}
          </a>
        )}
        <button
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={isUploading || isValidating}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-medium transition"
        >
          {isUploading ? 'Uploading...' : isValidating ? 'Validating...' : 'Upload EC'}
        </button>
        <input
          id="file-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            // Reset input so same file can be uploaded again
            e.target.value = '';
          }}
        />
      </header>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-[50px] left-0 right-0 bg-red-600 text-white px-4 py-2 text-sm z-40 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-white hover:text-gray-200 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className={`flex ${error ? 'pt-[90px]' : 'pt-[50px]'} h-full`}>
        <PdfPanel
          pdfUrl={pdfUrl}
          extractionData={extractionData}
          highlightRefs={highlightRefs}
        />
        <ResultsPanel
          checks={checks}
          outputVersion={outputVersion}
          downloadUrl={downloadUrl}
          onFeedback={handleFeedback}
          onHighlight={setHighlightRefs}
        />
      </div>

      {/* Processing Overlay */}
      {(isUploading || isValidating || isProcessingFeedback) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl px-8 py-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-900 font-medium">
              {isUploading && 'Uploading PDF...'}
              {isValidating && 'Running validation...'}
              {isProcessingFeedback && 'Processing feedback...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
