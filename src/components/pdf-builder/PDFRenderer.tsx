import { useState, useEffect } from 'react';
import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for PDF.js (recommended approach)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFRendererProps {
  fileUrl: string | File;
  width: number;
  height: number;
  pageNumber?: number;
  className?: string;
}

export const PDFRenderer = ({ 
  fileUrl, 
  width, 
  height, 
  pageNumber = 1, 
  className = "" 
}: PDFRendererProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('PDFRenderer: Attempting to load PDF:', typeof fileUrl === 'string' ? fileUrl : fileUrl.name);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setLoading(false);
    setError(`Failed to load PDF: ${error.message}`);
  }

  // Add loading state with timeout for debugging
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('PDF still loading after 5 seconds, this might indicate an issue');
        setError('PDF loading timeout - please try again');
        setLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-white`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading PDF...</span>
          <span className="text-xs">File: {typeof fileUrl === 'string' ? fileUrl.substring(0, 50) + '...' : fileUrl.name}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-white border-2 border-dashed border-muted-foreground/30`}>
        <div className="text-center text-muted-foreground">
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className="flex justify-center"
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          height={height}
          className="pdf-page"
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
};