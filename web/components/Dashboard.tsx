'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadHistory, deleteEntry, clearHistory } from '@/lib/history';
import type { HistoryEntry, VersionedOutput } from '@/lib/types';

interface DashboardProps {
  onNewValidation: () => void;
  onOpenEntry: (entry: HistoryEntry) => void;
}

function downloadVersion(v: VersionedOutput) {
  const blob = new Blob([JSON.stringify(v, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${v.ec_id || 'ec'}-v${v.version}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard({ onNewValidation, onOpenEntry }: DashboardProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'flags' | 'clear'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const filtered = useMemo(() => {
    let list = history;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        e.filename.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.form_version.toLowerCase().includes(q)
      );
    }
    if (filter === 'flags') list = list.filter(e => e.summary.flag > 0);
    if (filter === 'clear') list = list.filter(e => e.summary.flag === 0);
    return list;
  }, [history, search, filter]);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setHistory(h => h.filter(e => e.id !== id));
  };

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
    setConfirmClear(false);
  };

  const totalDocs = history.length;
  const withFlags = history.filter(e => e.summary.flag > 0).length;
  const allClear = history.filter(e => e.summary.flag === 0 && e.summary.total > 0).length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[50px] bg-gray-900 flex items-center px-5 gap-3 z-50 border-b border-white/10">
        <div className="font-mono text-sm font-semibold tracking-wider text-white uppercase">
          EC<span className="text-teal-500">.</span>Validator
        </div>
        <div className="w-px h-5 bg-white/20" />
        <div className="font-mono text-xs text-white/40 tracking-wide">Validation History</div>
        <div className="flex-1" />
        {history.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs font-mono text-white/30 hover:text-white/60 transition px-2 py-1"
          >
            Clear all
          </button>
        )}
        <button
          onClick={onNewValidation}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-2"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Validation
        </button>
      </header>

      <div className="pt-[50px] flex-1 overflow-y-auto">
        {/* Stats bar — only when there's history */}
        {history.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{totalDocs}</span>
              <span className="text-xs text-gray-500 leading-tight">documents<br/>validated</span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-sm font-mono font-bold text-gray-800">{withFlags}</span>
              <span className="text-xs text-gray-500">with flags</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-sm font-mono font-bold text-gray-800">{allClear}</span>
              <span className="text-xs text-gray-500">all clear</span>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-5 py-6">
          {history.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-gray-900 font-semibold text-lg mb-1">No validations yet</div>
              <div className="text-gray-500 text-sm mb-6">Upload a FEMA Elevation Certificate to run your first validation.</div>
              <button
                onClick={onNewValidation}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded text-sm font-medium transition"
              >
                Upload EC to validate
              </button>
            </div>
          ) : (
            <>
              {/* Search + filter row */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 relative">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by filename or EC ID…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div className="flex rounded border border-gray-300 overflow-hidden bg-white">
                  {(['all', 'flags', 'clear'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-2 text-xs font-medium transition ${
                        filter === f
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      } ${f !== 'clear' ? 'border-r border-gray-300' : ''}`}
                    >
                      {f === 'all' ? 'All' : f === 'flags' ? '⚑ Has flags' : '✓ All clear'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results count */}
              {filtered.length !== history.length && (
                <div className="text-xs text-gray-500 mb-3 font-mono">
                  {filtered.length} of {history.length} results
                </div>
              )}

              {/* History cards */}
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No results match your search or filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(entry => {
                    const hasFlags = entry.summary.flag > 0;
                    const latestV = entry.versions[entry.versions.length - 1];
                    return (
                      <div
                        key={entry.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition"
                      >
                        {/* Card header */}
                        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${hasFlags ? 'bg-amber-400' : 'bg-green-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                {entry.filename}
                              </span>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                hasFlags
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-green-50 text-green-700 border border-green-200'
                              }`}>
                                {hasFlags ? `${entry.summary.flag} flag${entry.summary.flag !== 1 ? 's' : ''}` : 'All clear'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="font-mono text-[10px] text-gray-400">{entry.id}</span>
                              <span className="text-gray-300">·</span>
                              <span className="font-mono text-[10px] text-gray-400">{entry.form_version}</span>
                              <span className="text-gray-300">·</span>
                              <span className="font-mono text-[10px] text-gray-400">
                                {Math.round(entry.extraction_confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-xs text-gray-500">{formatDate(entry.validated_at)}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{formatTime(entry.validated_at)}</div>
                          </div>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded transition ml-1"
                            title="Delete from history"
                          >
                            ×
                          </button>
                        </div>

                        {/* Summary chips */}
                        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                          <span className="font-mono text-[10px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            {entry.summary.total} checks
                          </span>
                          {entry.summary.flag > 0 && (
                            <span className="font-mono text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded">
                              ⚑ {entry.summary.flag} flag{entry.summary.flag !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="font-mono text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded">
                            ✓ {entry.summary.pass} pass
                          </span>
                          {entry.summary.na > 0 && (
                            <span className="font-mono text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                              {entry.summary.na} N/A
                            </span>
                          )}
                          {entry.summary.overrides > 0 && (
                            <span className="font-mono text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded">
                              {entry.summary.overrides} override{entry.summary.overrides !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Footer: open + download */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                          <button
                            onClick={() => onOpenEntry(entry)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 px-3 py-1.5 rounded transition"
                          >
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Open Results
                          </button>

                          <div className="w-px h-4 bg-gray-200 mx-1" />

                          <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Download</span>
                          {entry.versions.map(v => (
                            <button
                              key={v.version}
                              onClick={() => downloadVersion(v)}
                              title={`v${v.version} · ${v.summary.total} checks · ${v.summary.overrides} override(s)`}
                              className="flex items-center gap-1 text-[10px] font-mono border border-gray-300 rounded px-2 py-1 bg-white hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 transition"
                            >
                              <span className="font-bold">v{v.version}</span>
                              <span className="text-gray-400">
                                {v.version === 1 ? 'original' : `${v.summary.overrides} override${v.summary.overrides !== 1 ? 's' : ''}`}
                              </span>
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="ml-0.5">
                                <path d="M6 1v7M3 6l3 3 3-3M2 11h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          ))}
                          {latestV && entry.versions.length > 1 && (
                            <span className="text-[9px] font-mono text-gray-400 ml-0.5">← latest</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Clear all confirmation modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl px-6 py-5 max-w-sm mx-4">
            <div className="text-gray-900 font-semibold mb-1">Clear all history?</div>
            <div className="text-gray-500 text-sm mb-4">
              This removes all {history.length} validation records from this browser. Downloaded JSON files are not affected.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
