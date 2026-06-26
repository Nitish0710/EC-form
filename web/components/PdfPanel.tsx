'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Must use react-pdf's own bundled pdfjs-dist worker (not the top-level one — versions must match)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface BBox {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PdfPanelProps {
  pdfUrl: string | null;
  extractionData: any;
  highlightRefs: string[];
}

export default function PdfPanel({ pdfUrl, extractionData, highlightRefs }: PdfPanelProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const highlightBoxes: BBox[] = [];
  if (extractionData && highlightRefs.length > 0) {
    highlightRefs.forEach(ref => {
      const field = extractionData.fields?.[ref];
      if (field?.bbox) {
        highlightBoxes.push(field.bbox);
      }
    });
  }

  const getHighlightStyle = (bbox: BBox, currentPage: number): React.CSSProperties | null => {
    if (bbox.page !== currentPage) return null;
    
    const pageDim = pageDimensions.get(currentPage);
    if (!pageDim) return null;

    return {
      position: 'absolute',
      left: `${bbox.x * 100}%`,
      top: `${bbox.y * 100}%`,
      width: `${bbox.w * 100}%`,
      height: `${bbox.h * 100}%`,
      border: '2px solid #f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      pointerEvents: 'none',
      zIndex: 10,
    };
  };

  return (
    <section className="w-[44%] flex flex-col border-r border-gray-300 bg-gray-100">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded bg-white hover:border-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ‹
          </button>
          <span className="text-xs font-mono text-gray-600">
            {pageNumber} / {numPages || '?'}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded bg-white hover:border-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ›
          </button>
        </div>

        <span className="text-xs font-mono text-gray-600 ml-auto">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(Math.max(0.5, scale - 0.1))}
          className="px-2 h-7 border border-gray-300 rounded bg-white hover:border-teal-600 text-xs"
        >
          −
        </button>
        <button
          onClick={() => setScale(Math.min(2.0, scale + 0.1))}
          className="px-2 h-7 border border-gray-300 rounded bg-white hover:border-teal-600 text-xs"
        >
          +
        </button>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-5">
        {pdfUrl ? (
          <div className="relative mx-auto" ref={canvasRef}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => console.error('[PdfPanel] Load error:', err)}
              error={<div className="p-4 text-red-500 text-sm">Failed to load PDF. Check browser console for details.</div>}
              className="border border-gray-400 shadow-lg bg-white"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                onLoadSuccess={(page) => {
                  setPageDimensions(prev => {
                    const updated = new Map(prev);
                    updated.set(pageNumber, {
                      width: page.originalWidth,
                      height: page.originalHeight,
                    });
                    return updated;
                  });
                }}
              />
            </Document>

            {/* Highlight overlays */}
            {highlightBoxes.map((bbox, idx) => {
              const style = getHighlightStyle(bbox, pageNumber);
              return style ? (
                <div key={idx} style={style} />
              ) : null;
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No PDF loaded. Click "Upload EC" to begin.
          </div>
        )}
      </div>
    </section>
  );
}
