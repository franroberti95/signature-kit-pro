// Embedded PDF Builder Component - Standalone, no React Router dependencies
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToolbarPanel } from "@/components/pdf-builder/ToolbarPanel";
import { PDFCanvas } from "@/components/pdf-builder/PDFCanvas";
import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import SignatureKitProSDK from "./sdk";
import { toast } from "sonner";

export interface PDFBuilderEmbedProps {
  apiKey: string;
  apiBaseUrl?: string;
  customerId?: string; // Customer ID for multi-tenant scenarios
  initialDocumentId?: string; // Load existing document
  onSave?: (documentId: string) => void;
  onContinue?: (documentId: string) => void;
  className?: string;
}

export const PDFBuilderEmbed = ({
  apiKey,
  apiBaseUrl,
  customerId,
  initialDocumentId,
  onSave,
  onContinue,
  className = "",
}: PDFBuilderEmbedProps) => {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");
  const [loading, setLoading] = useState(true);
  const [sdk] = useState(() => new SignatureKitProSDK({ apiKey, apiBaseUrl, customerId }));

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load existing document if provided
        if (initialDocumentId) {
          const data = await sdk.loadPDFBuilder(initialDocumentId);
          if (data) {
            setPages(data.pages);
            setSelectedFormat(data.format);
            setLoading(false);
            return;
          }
        }

        // Create initial empty page
        const initialPage: PDFPage = {
          id: `page-${Date.now()}`,
          format: "A4",
          elements: [],
        };
        setPages([initialPage]);
        setLoading(false);
      } catch (error) {
        console.error('PDFBuilderEmbed: Error loading data:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load builder');
        // Still show empty page on error
        const initialPage: PDFPage = {
          id: `page-${Date.now()}`,
          format: "A4",
          elements: [],
        };
        setPages([initialPage]);
        setLoading(false);
      }
    };

    loadData();
  }, [initialDocumentId, sdk]);

  const addElement = (type: ElementType) => {
    if (pages.length === 0) return;
    
    const newElement: PDFElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: type === "checkbox" ? 20 : 150,
      height: type === "text" ? 40 : type === "checkbox" ? 20 : 60,
      required: false,
      placeholder: `Enter ${type}...`,
    };

    const updatedPages = [...pages];
    updatedPages[0].elements.push(newElement);
    setPages(updatedPages);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} field added`);
  };

  const updateElement = (pageIndex: number, elementId: string, updates: Partial<PDFElement>) => {
    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      updatedPages[pageIndex].elements[elementIndex] = {
        ...updatedPages[pageIndex].elements[elementIndex],
        ...updates,
      };
      setPages(updatedPages);
    }
  };

  const deleteElement = (pageIndex: number, elementId: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].elements = updatedPages[pageIndex].elements.filter(
      el => el.id !== elementId
    );
    setPages(updatedPages);
    toast.success("Element removed");
  };

  const addPage = () => {
    const newPage: PDFPage = {
      id: `page-${Date.now()}`,
      format: pages[0]?.format || selectedFormat,
      elements: [],
    };
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    toast.success("New page added");
  };

  const handleSave = async () => {
    try {
      const result = await sdk.savePDFBuilder(pages, selectedFormat, undefined, customerId);
      toast.success("Document saved successfully");
      onSave?.(result.documentId);
    } catch (error) {
      console.error('PDFBuilderEmbed: Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save document');
    }
  };

  const handleContinue = async () => {
    try {
      // Save first, then call onContinue
      const result = await sdk.savePDFBuilder(pages, selectedFormat, undefined, customerId);
      toast.success("Document saved");
      onContinue?.(result.documentId);
    } catch (error) {
      console.error('PDFBuilderEmbed: Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save document');
    }
  };

  if (loading) {
    return (
      <div className={`${className} min-h-screen bg-background flex items-center justify-center`}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading PDF Builder...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your workspace.</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className={`${className} min-h-screen bg-surface`}>
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">PDF Builder</h1>
            <p className="text-sm text-muted-foreground">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {selectedFormat}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="outline">
              Save
            </Button>
            {onContinue && (
              <Button onClick={handleContinue} className="bg-green-600 hover:bg-green-700">
                Continue
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <ToolbarPanel onAddElement={addElement} />
        <PDFCanvas
          pages={pages}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onAddElement={(pageIndex, element) => {
            const updatedPages = [...pages];
            updatedPages[pageIndex].elements.push(element);
            setPages(updatedPages);
          }}
          onAddPage={addPage}
        />
      </div>
    </div>
  );
};

export default PDFBuilderEmbed;

