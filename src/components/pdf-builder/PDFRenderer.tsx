import { useState, useEffect, useRef } from 'react';
import { usePDFSlick } from '@pdfslick/react';
import { Loader2 } from 'lucide-react';
import '@pdfslick/react/dist/pdf_viewer.css';

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
  const [documentUrl, setDocumentUrl] = useState<string>();
  const objectUrlRef = useRef<string | null>(null);

  // Handle File objects by creating object URLs
  useEffect(() => {
    if (fileUrl instanceof File) {
      // Create object URL for File objects
      const url = URL.createObjectURL(fileUrl);
      objectUrlRef.current = url;
      setDocumentUrl(url);
      console.log('PDFRenderer: Created object URL for File:', url);
    } else {
      setDocumentUrl(fileUrl);
      console.log('PDFRenderer: Using provided URL:', fileUrl);
    }

    // Cleanup object URL on unmount
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [fileUrl]);

  const { viewerRef, usePDFSlickStore, PDFSlickViewer } = usePDFSlick(
    documentUrl ? `${documentUrl}#page=${pageNumber}` : '', 
    {
      scaleValue: 'page-fit',
      singlePageViewer: true,
    }
  );

  // Get PDF loading state
  const store = usePDFSlickStore();
  
  useEffect(() => {
    console.log('PDFSlick store state:', {
      isDocumentLoaded: store.isDocumentLoaded,
      pagesReady: store.pagesReady,
      scale: store.scale,
      numPages: store.numPages,
      pageNumber: store.pageNumber,
      documentUrl,
      requestedPage: pageNumber
    });
  }, [store.isDocumentLoaded, store.pagesReady, store.scale, documentUrl, pageNumber]);

  // Add timeout fallback for stuck loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (store.isDocumentLoaded && !store.pagesReady) {
        console.warn('PDFSlick pages not ready after 10 seconds, forcing render');
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [store.isDocumentLoaded, store.pagesReady]);

  if (!documentUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-white`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Preparing PDF...</span>
        </div>
      </div>
    );
  }

  // Wait for document to load, but be more lenient with pagesReady
  if (!store.isDocumentLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-white`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading PDF pages...</span>
        </div>
      </div>
    );
  }

  // If document is loaded but pages aren't ready after some time, still try to render
  const shouldRender = store.isDocumentLoaded && (store.pagesReady || store.numPages > 0);

  if (!shouldRender) {
    return (
      <div className={`${className} flex items-center justify-center bg-white`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Waiting for PDF...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className} 
      style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}
    >
      <div className="absolute inset-0 pdfSlick">
        <PDFSlickViewer viewerRef={viewerRef} usePDFSlickStore={usePDFSlickStore} />
      </div>
    </div>
  );
};