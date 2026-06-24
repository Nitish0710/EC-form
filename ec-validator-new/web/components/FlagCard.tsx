'use client';

import { useState } from 'react';

interface Check {
  check_id: string;
  check_name: string;
  status: string;
  found: string;
  expected: string;
  confidence: 'High' | 'Medium' | 'Low';
  note?: string;
  highlight_refs: string[];
  review?: {
    action: 'confirmed' | 'override';
    reason_code?: string;
    comment?: string;
  };
  effective_status?: string;
}

interface FlagCardProps {
  check: Check;
  onFeedback: (checkId: string, action: 'confirmed' | 'override', reasonCode?: string, comment?: string) => void;
}

export default function FlagCard({ check, onFeedback }: FlagCardProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [reasonCode, setReasonCode] = useState<string>('');
  const [comment, setComment] = useState('');

  const isConfirmed = check.review?.action === 'confirmed';
  const isOverridden = check.review?.action === 'override';

  const confidenceDotColor = {
    High: 'bg-green-600',
    Medium: 'bg-amber-600',
    Low: 'bg-gray-400',
  }[check.confidence];

  const handleConfirm = () => {
    onFeedback(check.check_id, 'confirmed');
  };

  const handleOverrideSubmit = () => {
    if (reasonCode) {
      onFeedback(check.check_id, 'override', reasonCode, comment);
      setShowOverride(false);
      setReasonCode('');
      setComment('');
    }
  };

  return (
    <div
      className={`bg-white border ${
        isConfirmed
          ? 'border-green-300 border-l-4 border-l-green-500 opacity-80'
          : isOverridden
          ? 'border-teal-300 border-l-4 border-l-teal-500 opacity-75'
          : 'border-gray-300 border-l-4 border-l-amber-400'
      } rounded-r-md mb-3 overflow-hidden hover:border-amber-500 hover:shadow-md transition cursor-pointer`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="font-mono text-xs font-bold bg-gray-100 border border-gray-300 px-2 py-1 rounded min-w-[50px] text-center">
          {check.check_id}
        </div>
        <div className="flex-1 text-sm font-semibold text-gray-900 leading-tight">
          {check.check_name}
        </div>
        <div className="font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-amber-100 text-amber-700">
          {check.status}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        {/* Found/Expected */}
        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3 text-xs">
          <div className="grid grid-cols-[60px_1fr] gap-x-3 gap-y-2">
            <div className="font-bold text-[9px] tracking-wider uppercase text-amber-700 flex items-start py-1">
              Found
            </div>
            <div className="text-gray-900 leading-relaxed py-1 border-b border-amber-200">
              <span className="font-mono text-[10px]">{check.found}</span>
            </div>
            <div className="font-bold text-[9px] tracking-wider uppercase text-amber-700 flex items-start py-1">
              Expected
            </div>
            <div className="text-gray-900 leading-relaxed py-1">
              {check.expected}
            </div>
          </div>
        </div>

        {/* Note */}
        {check.note && (
          <div className="text-xs text-gray-700 leading-relaxed mb-3 px-3 py-2 bg-gray-50 rounded border-l-2 border-gray-400">
            {check.note}
          </div>
        )}

        {/* Confidence */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${confidenceDotColor}`}></span>
          <span className="font-mono text-[10px] text-gray-700">{check.confidence} confidence</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={isConfirmed}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border transition ${
              isConfirmed
                ? 'bg-green-50 border-green-300 text-green-700 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isConfirmed ? 'Confirmed' : 'Confirm flag'}
          </button>

          <button
            onClick={() => setShowOverride(!showOverride)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M8 2l2 2-6 6H2v-2l6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Override
          </button>
        </div>

        {/* Override Picker */}
        {showOverride && (
          <div className="mt-3 bg-teal-50 border border-teal-300 rounded p-3">
            <div className="text-[10px] font-semibold text-teal-800 mb-2 tracking-wide">
              Reason for override
            </div>
            <div className="space-y-2 mb-3">
              {[
                { value: 'too_strict', label: 'Rule is too strict for this building type' },
                { value: 'exception', label: 'Genuine exception — certifier confirmed correct' },
                { value: 'data_entry', label: 'Data entry error in the form' },
                { value: 'version', label: 'Form version difference' },
              ].map(option => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer text-xs text-gray-900 hover:bg-teal-100 px-2 py-1 rounded transition">
                  <input
                    type="radio"
                    name={`reason-${check.check_id}`}
                    value={option.value}
                    checked={reasonCode === option.value}
                    onChange={(e) => setReasonCode(e.target.value)}
                    className="accent-teal-600"
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment..."
              className="w-full text-xs border border-teal-300 rounded px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
              rows={2}
            />

            <button
              onClick={handleOverrideSubmit}
              disabled={!reasonCode}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-xs font-medium px-3 py-1.5 rounded transition"
            >
              Submit Override
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
