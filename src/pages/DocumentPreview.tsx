// Public document preview page - accepts template ID as query param
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CompletionComponent } from '@/components/completion/CompletionComponent';
import SignatureKitProSDK from '@/lib/sdk';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const DocumentPreview = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  const apiKey = searchParams.get('apiKey'); // Optional API key for public preview
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (!templateId) {
        setError('Template ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // If API key is provided, use it; otherwise try to load from public endpoint
        // For now, we'll require API key for security
        if (!apiKey) {
          setError('API key is required to preview documents');
          setLoading(false);
          return;
        }

        const sdk = new SignatureKitProSDK({ apiKey });
        const result = await sdk.getDocument(templateId);

        if (!result.document) {
          setError('Document not found');
          setLoading(false);
          return;
        }

        setDocumentData(result.document.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    };

    loadDocument();
  }, [templateId, apiKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading document...</h2>
          <p className="text-muted-foreground">Please wait while we load the document.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Make sure the URL includes both templateId and apiKey parameters.
          </p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No document data</h2>
          <p className="text-muted-foreground">The document could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Store document data in sessionStorage for CompletionComponent to read
  useEffect(() => {
    if (documentData) {
      const storageKey = documentData.format ? 'preview-pdf-data' : 'preview-rich-text-data';
      sessionStorage.setItem(storageKey, JSON.stringify(documentData));
    }
  }, [documentData]);

  // Determine document type and render appropriate completion component
  const documentType = documentData.format ? 'pdf' : 'rich_text';

  if (documentType === 'pdf') {
    // For PDF documents, use PDFCompletion logic
    return (
      <CompletionComponent
        sessionStorageKey="preview-pdf-data"
        dataValidator={(data: any) => {
          return data && data.pages && Array.isArray(data.pages) && data.pages.length > 0;
        }}
        dataExtractor={(data: any) => {
          return {
            pages: data.pages || [],
            elements: [],
          };
        }}
        backRoute="/"
        backButtonText="Close"
        title="Document Preview"
        subtitle="Preview of your document"
        onDownload={async () => {
          toast.info('Download functionality available in completion mode');
        }}
        onComplete={() => {
          toast.success('Document preview');
        }}
      />
    );
  } else {
    // For rich text documents, use RichTextCompletion logic
    return (
      <CompletionComponent
        sessionStorageKey="preview-rich-text-data"
        dataValidator={(data: any) => {
          return data && data.pages && Array.isArray(data.pages) && data.pages.length > 0;
        }}
        dataExtractor={(data: any) => {
          return {
            pages: data.pages || [],
            elements: [],
          };
        }}
        backRoute="/"
        backButtonText="Close"
        title="Document Preview"
        subtitle="Preview of your document"
        onDownload={async () => {
          toast.info('Download functionality available in completion mode');
        }}
        onComplete={() => {
          toast.success('Document preview');
        }}
      />
    );
  }
};

export default DocumentPreview;

