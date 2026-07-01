'use client';

import { useState } from 'react';
import FlagCard from './FlagCard';
import type { Check, VersionedOutput } from '@/lib/types';

interface ResultsPanelProps {
  checks: Check[];
  versions: VersionedOutput[];
  onFeedback: (checkId: string, action: 'confirmed' | 'override', reasonCode?: string, comment?: string) => void;
  onDownload: (v: VersionedOutput) => void;
  onHighlight: (refs: string[]) => void;
}

// COMP_A1 → "A1", COMP_A5_datum → "A5", COMP_B1a → "B1a", COMP_A8a → "A8a"
function fieldLabel(checkId: string): string {
  if (!checkId.startsWith('COMP_')) return checkId;
  return checkId.replace(/^COMP_/, '').split('_')[0];
}

export default function ResultsPanel({ checks, versions, onFeedback, onDownload, onHighlight }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'flag' | 'pass' | 'na'>('all');

  const flagChecks = checks.filter(c => c.status === 'FLAG' && !c.effective_status);
  const passChecks = checks.filter(c => c.status === 'PASS');
  const naChecks = checks.filter(c => c.status === 'N/A');

  const visibleChecks = activeTab === 'flag' ? flagChecks :
                        activeTab === 'pass' ? passChecks :
                        activeTab === 'na' ? naChecks :
                        checks;

  const latestVersion = versions[versions.length - 1];

  return (
    <section className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-5 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-gray-900">Validation Results</div>
          {latestVersion && (
            <div className="text-[10px] font-mono text-gray-500">
              {latestVersion.summary.pass}P · {latestVersion.summary.flag}F · {latestVersion.summary.na}N/A
            </div>
          )}
        </div>

        {/* Download row */}
        {versions.length > 0 && (
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <button
              onClick={() => onDownload(latestVersion)}
              title={`Download v${latestVersion.version} — ${latestVersion.summary.total} checks · generated ${new Date(latestVersion.generated_at).toLocaleTimeString()}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 6l3 3 3-3M2 11h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download JSON
              {latestVersion.version > 1 && (
                <span className="opacity-80 font-normal">
                  — {latestVersion.summary.overrides} override{latestVersion.summary.overrides !== 1 ? 's' : ''}
                </span>
              )}
            </button>
            {versions.length > 1 && versions.slice(0, -1).map(v => (
              <button
                key={v.version}
                onClick={() => onDownload(v)}
                title={`v${v.version} — original · ${v.summary.total} checks`}
                className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition"
              >
                v{v.version} original
              </button>
            ))}
          </div>
        )}

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
                key={fieldLabel(check.check_id)}
                check={check}
                onFeedback={onFeedback}
                onHighlight={onHighlight}
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
                key={fieldLabel(check.check_id)}
                className="flex items-center gap-3 px-3 py-2 rounded mb-1 hover:bg-gray-200 cursor-pointer"
                onClick={() => onHighlight(check.highlight_refs || [])}
              >
                <div className="font-mono text-[10px] bg-gray-200 border border-gray-300 px-2 py-0.5 rounded text-center min-w-[40px]">
                  {fieldLabel(check.check_id)}
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
                key={fieldLabel(check.check_id)}
                className="flex items-center gap-3 px-3 py-2 rounded mb-1 hover:bg-gray-200 cursor-pointer"
                onClick={() => onHighlight(check.highlight_refs || [])}
              >
                <div className="font-mono text-[10px] bg-gray-200 border border-gray-300 px-2 py-0.5 rounded text-center min-w-[40px]">
                  {fieldLabel(check.check_id)}
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
                  <FlagCard key={fieldLabel(check.check_id)} check={check} onFeedback={onFeedback} onHighlight={onHighlight} />
                ))}
              </div>
            )}
            {passChecks.length > 0 && (
              <div className="mb-5">
                <div className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 pb-2 border-b border-gray-300 mb-3">
                  Passed
                </div>
                {passChecks.map(check => (
                  <div
                    key={fieldLabel(check.check_id)}
                    className="flex items-center gap-3 px-3 py-2 rounded mb-1 hover:bg-gray-200 cursor-pointer"
                    onClick={() => onHighlight(check.highlight_refs || [])}
                  >
                    <div className="font-mono text-[10px] bg-gray-200 border border-gray-300 px-2 py-0.5 rounded text-center min-w-[40px]">
                      {fieldLabel(check.check_id)}
                    </div>
                    <div className="flex-1 text-xs text-gray-700">{check.check_name}</div>
                    <div className="text-green-600 text-sm font-bold">✓</div>
                    <div className="font-mono text-[10px] text-gray-500 text-right max-w-[100px] truncate">
                      {check.found}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {naChecks.length > 0 && (
              <div className="mb-5">
                <div className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 pb-2 border-b border-gray-300 mb-3">
                  Not applicable
                </div>
                {naChecks.map(check => (
                  <div key={fieldLabel(check.check_id)} className="flex items-center gap-3 px-3 py-2 rounded mb-1 opacity-60">
                    <div className="font-mono text-[10px] bg-gray-200 border border-gray-300 px-2 py-0.5 rounded text-center min-w-[40px]">
                      {fieldLabel(check.check_id)}
                    </div>
                    <div className="flex-1 text-xs text-gray-500">{check.check_name}</div>
                    <div className="font-mono text-[10px] text-gray-400">—</div>
                  </div>
                ))}
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
