'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FoundBox {
  x: number; // normalized 0-1 from left
  y: number; // normalized 0-1 from top
  w: number;
  h: number;
}

interface PdfPanelProps {
  pdfUrl: string | null;
  extractionData: any;
  highlightRefs: string[];
  highlightKey: number;
}

export default function PdfPanel({ pdfUrl, extractionData, highlightRefs, highlightKey }: PdfPanelProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [foundBoxes, setFoundBoxes] = useState<FoundBox[]>([]);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

  function onDocumentLoadSuccess(pdf: any) {
    setNumPages(pdf.numPages);
    setPageNumber(1);
    setPdfDoc(pdf);
  }

  // Jump to relevant page when highlight fires
  useEffect(() => {
    if (highlightRefs.length === 0 || !extractionData?.fields) return;
    for (const ref of highlightRefs) {
      const page = extractionData.fields[ref]?.page;
      if (page && page >= 1) {
        setPageNumber(page);
        return;
      }
    }
  // highlightKey ensures re-trigger even when same refs are clicked again
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightKey]);

  // Search for field values in annotations (fillable PDFs) then text content
  useEffect(() => {
    if (!pdfDoc || highlightRefs.length === 0 || !extractionData?.fields) {
      setFoundBoxes([]);
      return;
    }

    let cancelled = false;

    const findBoxes = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });

        // Get both annotations and text content in parallel
        const [annotations, textContent] = await Promise.all([
          page.getAnnotations(),
          page.getTextContent(),
        ]);

        if (cancelled) return;

        const boxes: FoundBox[] = [];

        for (const ref of highlightRefs) {
          const field = extractionData.fields[ref];
          const searchVal = field?.value?.toString().trim();
          if (!searchVal || searchVal.length < 2) continue;

          let found = false;

          // 1. Try annotation widgets first (fillable PDF form fields)
          for (const ann of annotations) {
            const annVal = ann.fieldValue?.toString().trim();
            if (annVal && annVal === searchVal) {
              const [x1, y1, x2, y2] = ann.rect as number[];
              boxes.push({
                x: x1 / viewport.width,
                y: (viewport.height - y2) / viewport.height,
                w: (x2 - x1) / viewport.width,
                h: (y2 - y1) / viewport.height,
              });
              found = true;
              break;
            }
          }

          if (found) continue;

          // 2. Fall back to text content (scanned / non-fillable PDFs)
          for (const item of textContent.items as any[]) {
            const str = item.str?.trim() ?? '';
            if (!str || str.length < 2) continue;
            if (str.includes(searchVal) || (searchVal.length > 4 && searchVal.includes(str))) {
              const [, , , , x, y] = item.transform as number[];
              const w = (item.width as number) || 40;
              const h = Math.abs(item.height as number) || 10;
              boxes.push({
                x: x / viewport.width,
                y: 1 - (y + h) / viewport.height,
                w: w / viewport.width,
                h: h / viewport.height,
              });
              break;
            }
          }
        }

        setFoundBoxes(boxes);
      } catch (e) {
        console.error('[PdfPanel] Highlight search error:', e);
      }
    };

    findBoxes();
    return () => { cancelled = true; };
  }, [highlightKey, pdfDoc, pageNumber, extractionData]);

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
          <div className="mx-auto w-fit">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => console.error('[PdfPanel] Load error:', err)}
              error={<div className="p-4 text-red-500 text-sm">Failed to load PDF.</div>}
              className="border border-gray-400 shadow-lg bg-white"
            >
              {/* Explicit size so overlay percentages map exactly onto the page canvas */}
              <div
                className="relative"
                style={pageSize ? {
                  width: pageSize.width * scale,
                  height: pageSize.height * scale,
                } : undefined}
              >
                <Page
                  key={pageNumber}
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  onLoadSuccess={(p) => setPageSize({ width: p.originalWidth, height: p.originalHeight })}
                />

                {/* Amber highlight overlays */}
                {pageSize && foundBoxes.map((box, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${Math.max(box.w * 100, 3)}%`,
                      height: `${Math.max(box.h * 100, 1)}%`,
                      border: '2px solid #f59e0b',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      pointerEvents: 'none',
                      zIndex: 20,
                      borderRadius: '3px',
                      boxShadow: '0 0 6px rgba(245,158,11,0.5)',
                    }}
                  />
                ))}
              </div>
            </Document>
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
