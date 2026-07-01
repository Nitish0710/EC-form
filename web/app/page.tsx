'use client';

import { useState, useRef } from 'react';
import PdfPanel from '@/components/PdfPanel';
import ResultsPanel from '@/components/ResultsPanel';
import Dashboard from '@/components/Dashboard';
import { generateEcId, validateEcFile } from '@/lib/blob-utils';
import { saveEntry, loadHistory } from '@/lib/history';
import type { Check, VersionedOutput, HistoryEntry } from '@/lib/types';

function buildVersionedOutput(
  versionNum: number,
  ecId: string | null,
  formVersion: string,
  extractionConfidence: number,
  currentChecks: Check[]
): VersionedOutput {
  return {
    schema_version: '1.0',
    version: versionNum,
    ec_id: ecId,
    form_version: formVersion,
    generated_at: new Date().toISOString(),
    extraction_confidence: extractionConfidence,
    summary: {
      total: currentChecks.length,
      pass: currentChecks.filter(c => c.status === 'PASS').length,
      // Only unreviewed flags count — confirmed/overridden are considered handled
      flag: currentChecks.filter(c => c.status === 'FLAG' && !c.review).length,
      na: currentChecks.filter(c => c.status === 'N/A').length,
      unverifiable: currentChecks.filter(c => c.status === 'UNVERIFIABLE').length,
      overrides: currentChecks.filter(c => c.review?.action === 'override').length,
      confirmed: currentChecks.filter(c => c.review?.action === 'confirmed').length,
    },
    checks: currentChecks,
  };
}

export default function Home() {
  const [view, setView] = useState<'dashboard' | 'validator'>('dashboard');

  // Validator state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null); // Vercel Blob URL for history
  const [ecId, setEcId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [extractionData, setExtractionData] = useState<any>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [versions, setVersions] = useState<VersionedOutput[]>([]);
  const [highlightRefs, setHighlightRefs] = useState<string[]>([]);
  const [highlightKey, setHighlightKey] = useState(0);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStep, setValidationStep] = useState<'reading' | 'validating' | null>(null);
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadVersion = (v: VersionedOutput) => {
    const blob = new Blob([JSON.stringify(v, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${v.ec_id || 'ec'}-v${v.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setIsUploading(true);
      setVersions([]);
      setChecks([]);
      setExtractionData(null);
      setPdfBlobUrl(null);

      validateEcFile(file);

      const newEcId = generateEcId(file.name);
      setEcId(newEcId);
      setFilename(file.name);

      // Show PDF immediately via local object URL
      const localUrl = URL.createObjectURL(file);
      setPdfUrl(localUrl);
      setIsUploading(false);
      setView('validator');

      // Upload to Vercel Blob and convert to base64 in parallel
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('ecId', newEcId);

      const [blobResult, base64] = await Promise.all([
        fetch('/api/store-pdf', { method: 'POST', body: formData })
          .then(r => r.json())
          .catch(() => ({ url: null })),
        (async () => {
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          return btoa(binary);
        })(),
      ]);

      const blobPdfUrl: string | null = blobResult.url || null;
      setPdfBlobUrl(blobPdfUrl);

      await handleValidation(base64, newEcId, file.name, blobPdfUrl);

    } catch (err) {
      console.error('[Upload] Error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleValidation = async (
    pdfBase64: string,
    ecIdValue: string,
    fname: string,
    blobPdfUrl: string | null
  ) => {
    try {
      setIsValidating(true);
      setValidationStep('reading');
      setError(null);

      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64, ecId: ecIdValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Validation failed');
      }

      setValidationStep('validating');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Validation failed');
      }

      const newExtractionData = result.extractionData || { fields: {} };
      const newChecks: Check[] = result.checks || [];

      setExtractionData(newExtractionData);
      setChecks(newChecks);

      const v1 = buildVersionedOutput(
        1,
        ecIdValue,
        newExtractionData.form_version || result.formVersion || 'FF-206-FY-22-152',
        newExtractionData.extraction_confidence ?? result.extractionConfidence ?? 0,
        newChecks
      );
      setVersions([v1]);

      saveEntry({
        id: ecIdValue,
        filename: fname,
        validated_at: v1.generated_at,
        form_version: v1.form_version,
        extraction_confidence: v1.extraction_confidence,
        summary: v1.summary,
        versions: [v1],
        pdfUrl: blobPdfUrl || undefined,
      });

      setIsValidating(false);
      setValidationStep(null);

    } catch (err) {
      console.error('[Validate] Error:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
      setIsValidating(false);
      setValidationStep(null);
    }
  };

  const handleFeedback = (
    checkId: string,
    action: 'confirmed' | 'override',
    reasonCode?: string,
    comment?: string
  ) => {
    setIsProcessingFeedback(true);

    const updatedChecks = checks.map(check =>
      check.check_id === checkId
        ? {
            ...check,
            review: {
              action,
              reason_code: reasonCode,
              comment,
              reviewed_at: new Date().toISOString(),
            },
            effective_status: (action === 'override' ? 'DISMISSED' : 'FLAG') as 'FLAG' | 'DISMISSED',
          }
        : check
    );

    setChecks(updatedChecks);

    const base = versions[0];
    const newVer = buildVersionedOutput(
      versions.length + 1,
      ecId,
      base?.form_version || 'FF-206-FY-22-152',
      base?.extraction_confidence || 0,
      updatedChecks
    );
    const updatedVersions = [...versions, newVer];
    setVersions(updatedVersions);

    // Persist updated summary + versions; preserve pdfUrl from existing entry
    if (ecId) {
      const existing = loadHistory().find(e => e.id === ecId);
      saveEntry({
        id: ecId,
        filename,
        validated_at: versions[0]?.generated_at || new Date().toISOString(),
        form_version: newVer.form_version,
        extraction_confidence: newVer.extraction_confidence,
        summary: newVer.summary,
        versions: updatedVersions,
        pdfUrl: existing?.pdfUrl ?? pdfBlobUrl ?? undefined,
      });
    }

    setIsProcessingFeedback(false);
  };

  const openEntry = (entry: HistoryEntry) => {
    const latest = entry.versions[entry.versions.length - 1];
    setEcId(entry.id);
    setFilename(entry.filename);
    // Proxy through same origin to avoid CORS issues with Vercel Blob URLs
    const proxied = entry.pdfUrl
      ? `/api/pdf-proxy?url=${encodeURIComponent(entry.pdfUrl)}`
      : null;
    setPdfUrl(proxied);
    setPdfBlobUrl(entry.pdfUrl || null);
    setExtractionData(null);
    setChecks(latest.checks);
    setVersions(entry.versions);
    setHighlightRefs([]);
    setHighlightKey(0);
    setError(null);
    setView('validator');
  };

  const goToDashboard = () => {
    setView('dashboard');
    setError(null);
  };

  if (view === 'dashboard') {
    return (
      <>
        <Dashboard onNewValidation={triggerFileInput} onOpenEntry={openEntry} />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = '';
          }}
        />
      </>
    );
  }

  // Validator view
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[50px] bg-gray-900 flex items-center px-4 gap-3 z-50 border-b border-white/10">
        <button
          onClick={goToDashboard}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/90 transition font-mono"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M11 6H1M5 2L1 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          History
        </button>
        <div className="w-px h-5 bg-white/20" />
        <div className="font-mono text-sm font-semibold tracking-wider text-white uppercase">
          EC<span className="text-teal-500">.</span>Validator
        </div>
        <div className="w-px h-5 bg-white/20" />
        <div className="flex-1 font-mono text-xs text-white/60 truncate">
          {isUploading && 'Uploading...'}
          {isValidating && validationStep === 'reading' && 'Reading form...'}
          {isValidating && validationStep === 'validating' && 'Running validation...'}
          {!isUploading && !isValidating && ecId && `EC ID: ${ecId}`}
          {!isUploading && !isValidating && !ecId && 'No document'}
        </div>
        <button
          onClick={triggerFileInput}
          disabled={isUploading || isValidating}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-medium transition"
        >
          {isUploading
            ? 'Uploading...'
            : validationStep === 'reading'
            ? 'Reading...'
            : validationStep === 'validating'
            ? 'Validating...'
            : 'Upload EC'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = '';
          }}
        />
      </header>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-[50px] left-0 right-0 bg-red-600 text-white px-4 py-2 text-sm z-40 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white hover:text-gray-200 font-bold">×</button>
        </div>
      )}

      {/* Main Layout */}
      <div className={`flex ${error ? 'pt-[90px]' : 'pt-[50px]'} h-full`}>
        {pdfUrl && (
          <PdfPanel
            pdfUrl={pdfUrl}
            extractionData={extractionData}
            highlightRefs={highlightRefs}
            highlightKey={highlightKey}
          />
        )}
        <ResultsPanel
          checks={checks}
          versions={versions}
          onFeedback={handleFeedback}
          onDownload={downloadVersion}
          onHighlight={(refs) => {
            setHighlightRefs(refs);
            setHighlightKey(k => k + 1);
          }}
        />
      </div>

      {/* Processing Overlay */}
      {(isUploading || isValidating || isProcessingFeedback) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl px-8 py-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-900 font-medium">
              {isUploading && 'Uploading PDF...'}
              {isValidating && validationStep === 'reading' && 'Reading form...'}
              {isValidating && validationStep === 'validating' && 'Running validation...'}
              {isProcessingFeedback && 'Saving override...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
