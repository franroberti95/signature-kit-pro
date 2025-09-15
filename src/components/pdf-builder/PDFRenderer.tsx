import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use CDN worker for better reliability
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const [documentUrl, setDocumentUrl] = useState<string | File>();
  const objectUrlRef = useRef<string | null>(null);

  // Handle File objects by creating object URLs
  useEffect(() => {
    if (fileUrl instanceof File) {
      // Create object URL for File objects
      const url = URL.createObjectURL(fileUrl);
      objectUrlRef.current = url;
      setDocumentUrl(url);
      console.log('PDFRenderer: Created object URL for file:', fileUrl.name);
    } else {
      setDocumentUrl(fileUrl);
      console.log('PDFRenderer: Using direct URL:', fileUrl);
    }

    // Cleanup object URL on unmount
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [fileUrl]);

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

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-white`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading PDF...</span>
          <span className="text-xs">
            File: {typeof fileUrl === 'string' ? fileUrl.substring(0, 50) + '...' : fileUrl.name}
          </span>
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

  if (!documentUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-white`}>
        <div className="text-center text-muted-foreground">
          <span className="text-sm">Preparing document...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Document
        file={documentUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className="flex justify-center"
        options={{
          // Add options for better compatibility
          cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        }}
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