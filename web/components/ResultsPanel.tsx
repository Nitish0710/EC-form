'use client';

import { useState } from 'react';
import FlagCard from './FlagCard';

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

interface ResultsPanelProps {
  checks: Check[];
  outputVersion: number;
  downloadUrl: string | null;
  onFeedback: (checkId: string, action: 'confirmed' | 'override', reasonCode?: string, comment?: string) => void;
}

export default function ResultsPanel({ checks, outputVersion, downloadUrl, onFeedback }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'flag' | 'pass' | 'na'>('all');

  const flagChecks = checks.filter(c => c.status === 'FLAG' && !c.effective_status);
  const passChecks = checks.filter(c => c.status === 'PASS');
  const naChecks = checks.filter(c => c.status === 'N/A');

  const visibleChecks = activeTab === 'flag' ? flagChecks :
                        activeTab === 'pass' ? passChecks :
                        activeTab === 'na' ? naChecks :
                        checks;

  return (
    <section className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-5 pt-4 pb-0 flex-shrink-0">
        <div className="text-sm font-semibold text-gray-900 mb-1">
          Validation Results
        </div>
        <div className="text-xs font-mono text-gray-600 mb-3 flex gap-4">
          <span>Version {outputVersion}</span>
          <span>{checks.length} checks</span>
          {downloadUrl && (
            <a href={downloadUrl} className="text-teal-600 hover:underline">
              Download Latest
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs border border-b-0 ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            } first:rounded-tl last:rounded-tr`}
          >
            <span className="font-mono font-bold mr-1">{checks.length}</span> checks
          </button>
          <button
            onClick={() => setActiveTab('flag')}
            className={`px-4 py-2 text-xs border border-b-0 ${
              activeTab === 'flag'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-mono font-bold mr-1 text-amber-600">{flagChecks.length}</span> flags
          </button>
          <button
            onClick={() => setActiveTab('pass')}
            className={`px-4 py-2 text-xs border border-b-0 ${
              activeTab === 'pass'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-mono font-bold mr-1 text-green-600">{passChecks.length}</span> pass
          </button>
          <button
            onClick={() => setActiveTab('na')}
            className={`px-4 py-2 text-xs border border-b-0 ${
              activeTab === 'na'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            } last:rounded-tr`}
          >
            <span className="font-mono font-bold mr-1">{naChecks.length}</span> N/A
          </button>
        </div>
      </div>

      {/* Results Scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'flag' && flagChecks.length > 0 && (
          <div className="mb-5">
            <div className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 pb-2 border-b border-gray-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              Flagged — review required
            </div>
            {flagChecks.map(check => (
              <FlagCard
                key={check.check_id}
                check={check}
                onFeedback={onFeedback}
              />
            ))}
          </div>
        )}

        {activeTab === 'pass' && passChecks.length > 0 && (
          <div className="mb-5">
            <div className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 pb-2 border-b border-gray-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              Passing — no issues found
            </div>
            {passChecks.map(check => (
              <div
                key={check.check_id}
                className="flex items-center gap-3 px-3 py-2 rounded mb-1 hover:bg-gray-100"
              >
                <div className="font-mono text-[10px] bg-gray-200 border border-gray-300 px-2 py-0.5 rounded text-center min-w-[40px]">
                  {check.check_id}
                </div>
                <div className="flex-1 text-xs text-gray-700">
                  {check.check_name}
                </div>
                <div className="text-green-600 text-sm">✓</div>
                <div className="font-mono text-[10px] text-gray-500 text-right">
                  {check.found.slice(0, 30)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'na' && naChecks.length > 0 && (
          <div className="mb-5">
            <div className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 pb-2 border-b border-gray-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              Not applicable — skipped
            </div>
            {naChecks.map(check => (
              <div
                key={check.check_id}
                className="flex items-center gap-3 px-3 py-2 rounded mb-1 hover:bg-gray-100"
              >
                <div className="font-mono text-[10px] bg-gray-200 border border-gray-300 px-2 py-0.5 rounded text-center min-w-[40px]">
                  {check.check_id}
                </div>
                <div className="flex-1 text-xs text-gray-700">
                  {check.check_name}
                </div>
                <div className="font-mono text-[10px] text-gray-500">
                  {check.expected.slice(0, 40)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'all' && (
          <>
            {flagChecks.length > 0 && (
              <div className="mb-5">
                <div className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 pb-2 border-b border-gray-300 mb-3">
                  Flagged
                </div>
                {flagChecks.map(check => (
                  <FlagCard key={check.check_id} check={check} onFeedback={onFeedback} />
                ))}
              </div>
            )}
            {passChecks.length > 0 && (
              <div className="text-xs text-gray-600 mb-2">
                {passChecks.length} checks passed
              </div>
            )}
          </>
        )}

        {visibleChecks.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No results yet. Upload a document to begin validation.
          </div>
        )}
      </div>
    </section>
  );
}
