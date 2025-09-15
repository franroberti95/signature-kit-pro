import { useState, useEffect, useRef } from 'react';
import { RPProvider, RPDefaultLayout, RPPages, RPConfig } from '@pdf-viewer/react';
import { Loader2 } from 'lucide-react';

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
    <div className={className}>
      <RPConfig>
        <RPProvider src={documentUrl}>
          <RPDefaultLayout style={{ width: `${width}px`, height: `${height}px` }}>
            <RPPages />
          </RPDefaultLayout>
        </RPProvider>
      </RPConfig>
    </div>
  );
};