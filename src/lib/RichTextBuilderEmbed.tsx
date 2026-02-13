// Embedded Rich Text Builder Component - Standalone, no React Router dependencies
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PenTool, Plus } from "lucide-react";
import RichTextEditor, { RichTextEditorRef } from "@/components/pdf-builder/RichTextEditor";
import SignatureKitProSDK from "./sdk";
import { VariableType, COMMON_VARIABLES } from '@/constants/variables';
import { TRUE_A4_DIMENSIONS, PAGE_LIMITS } from '@/constants/dimensions';

const { SIGNATURE_WIDTH, SIGNATURE_HEIGHT } = TRUE_A4_DIMENSIONS;

interface InteractiveElement {
  id: string;
  type: 'signature';
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

interface PageData {
  id: string;
  content: string;
  elements: InteractiveElement[];
}

export interface RichTextBuilderEmbedProps {
  apiKey: string;
  apiBaseUrl?: string;
  customerId?: string; // Customer ID for multi-tenant scenarios
  initialDocumentId?: string;
  onSave?: (documentId: string) => void;
  onContinue?: (documentId: string) => void;
  className?: string;
}

export const RichTextBuilderEmbed = ({
  apiKey,
  apiBaseUrl,
  customerId,
  initialDocumentId,
  onSave,
  onContinue,
  className = "",
}: RichTextBuilderEmbedProps) => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const editorRefs = useRef<(RichTextEditorRef | null)[]>([]);
  const [sdk] = useState(() => new SignatureKitProSDK({ apiKey, apiBaseUrl, customerId }));

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (initialDocumentId) {
          const result = await sdk.getDocument(initialDocumentId);
          if (result.document?.data) {
            const data = result.document.data;
            if (data.pages && Array.isArray(data.pages)) {
              setPages(data.pages.map((page: any) => ({
                id: page.id || `page-${Date.now()}-${Math.random()}`,
                content: page.content || page.richTextContent || '',
                elements: (page.elements || []).map((el: any) => ({
                  id: el.id || `element-${Date.now()}-${Math.random()}`,
                  type: el.type || 'signature',
                  name: el.name || el.properties?.fieldName || 'signature',
                  label: el.label || el.preDefinedLabel || el.properties?.placeholder || 'Signature',
                  x: el.x || 100,
                  y: el.y || 100,
                  width: el.width || SIGNATURE_WIDTH,
                  height: el.height || SIGNATURE_HEIGHT,
                  pageIndex: el.pageIndex ?? 0,
                })),
              })));
              setLoading(false);
              return;
            }
          }
        }

        // Create initial empty page
        const initialPage: PageData = {
          id: `page-${Date.now()}`,
          content: '',
          elements: [],
        };
        setPages([initialPage]);
        setLoading(false);
      } catch (error) {
        console.error('RichTextBuilderEmbed: Error loading data:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load builder');
        const initialPage: PageData = {
          id: `page-${Date.now()}`,
          content: '',
          elements: [],
        };
        setPages([initialPage]);
        setLoading(false);
      }
    };

    loadData();
  }, [initialDocumentId, sdk]);

  const addPage = () => {
    if (pages.length >= PAGE_LIMITS.MAX_PAGES) {
      toast.error(`Maximum ${PAGE_LIMITS.MAX_PAGES} pages allowed`);
      return;
    }

    const newPage: PageData = {
      id: `page-${Date.now()}`,
      content: '',
      elements: [],
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
    toast.success("New page added");
  };

  const addSignature = () => {
    if (pages.length === 0) return;

    const currentPage = pages[currentPageIndex];
    if (currentPage.elements.length >= PAGE_LIMITS.MAX_ELEMENTS_PER_PAGE) {
      toast.error(`Maximum ${PAGE_LIMITS.MAX_ELEMENTS_PER_PAGE} elements per page`);
      return;
    }

    const newElement: InteractiveElement = {
      id: `element-${Date.now()}`,
      type: 'signature',
      name: `signature_${currentPage.elements.length + 1}`,
      label: `Signature ${currentPage.elements.length + 1}`,
      x: 100,
      y: 100,
      width: SIGNATURE_WIDTH,
      height: SIGNATURE_HEIGHT,
      pageIndex: currentPageIndex,
    };

    const updatedPages = [...pages];
    updatedPages[currentPageIndex].elements.push(newElement);
    setPages(updatedPages);
    toast.success("Signature field added");
  };

  const updateElement = (elementId: string, updates: Partial<InteractiveElement>) => {
    const updatedPages = [...pages];
    const page = updatedPages[currentPageIndex];
    const elementIndex = page.elements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      page.elements[elementIndex] = {
        ...page.elements[elementIndex],
        ...updates,
      };
      setPages(updatedPages);
    }
  };

  const deleteElement = (elementId: string) => {
    const updatedPages = [...pages];
    updatedPages[currentPageIndex].elements = updatedPages[currentPageIndex].elements.filter(
      el => el.id !== elementId
    );
    setPages(updatedPages);
    toast.success("Element removed");
  };

  const updatePageContent = (pageIndex: number, content: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].content = content;
    setPages(updatedPages);
  };

  const handleSave = async () => {
    try {
      const result = await sdk.createDocument({
        documentType: 'rich_text',
        title: 'Untitled Rich Text Document',
        data: { pages },
      });
      toast.success("Document saved successfully");
      onSave?.(result.document.id);
    } catch (error) {
      console.error('RichTextBuilderEmbed: Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save document');
    }
  };

  const handleContinue = async () => {
    try {
      const result = await sdk.createDocument({
        documentType: 'rich_text',
        title: 'Untitled Rich Text Document',
        data: { pages },
      });
      toast.success("Document saved");
      onContinue?.(result.document.id);
    } catch (error) {
      console.error('RichTextBuilderEmbed: Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save document');
    }
  };

  if (loading) {
    return (
      <div className={`${className} min-h-screen bg-background flex items-center justify-center`}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Rich Text Builder...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your workspace.</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return null;
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className={`${className} min-h-screen bg-background`}>
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Rich Text Builder</h1>
            <p className="text-sm text-muted-foreground">
              Page {currentPageIndex + 1} of {pages.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={addPage} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
            <Button onClick={addSignature} variant="outline" size="sm">
              <PenTool className="h-4 w-4 mr-2" />
              Add Signature
            </Button>
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

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Page Navigation */}
        {pages.length > 1 && (
          <div className="border-b border-border bg-muted px-6 py-2 flex gap-2 overflow-x-auto">
            {pages.map((page, index) => (
              <Badge
                key={page.id}
                variant={index === currentPageIndex ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCurrentPageIndex(index)}
              >
                Page {index + 1}
              </Badge>
            ))}
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-white shadow-lg"
              style={{
                width: `${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px`,
                minHeight: `${TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}px`,
                position: 'relative',
              }}
            >
              <RichTextEditor
                ref={(ref) => {
                  editorRefs.current[currentPageIndex] = ref;
                }}
                value={currentPage.content}
                onChange={(content) => updatePageContent(currentPageIndex, content)}
                variables={COMMON_VARIABLES}
                readOnly={false}
              />

              {/* Signature Elements */}
              {currentPage.elements.map((element) => (
                <div
                  key={element.id}
                  className="absolute border-2 border-dashed border-purple-400 bg-purple-50 bg-opacity-90 pointer-events-auto cursor-move group hover:border-purple-500 transition-colors"
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                  }}
                >
                  <div className="p-2 text-center text-purple-700 text-sm font-medium flex flex-col items-center justify-center h-full">
                    <PenTool className="h-4 w-4 mb-1" />
                    <span>{element.label}</span>
                  </div>
                  <button
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    onClick={() => deleteElement(element.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextBuilderEmbed;

