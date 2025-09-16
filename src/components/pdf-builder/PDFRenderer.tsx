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