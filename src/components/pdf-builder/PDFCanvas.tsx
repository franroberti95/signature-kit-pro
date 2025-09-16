import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PDFPage, PDFElement, ElementType } from "./PDFBuilder";
import { PDFElementComponent } from "./PDFElementComponent";
import { PDFRenderer } from "./PDFRenderer";
import { toast } from "sonner";

interface PDFCanvasProps {
  pages: PDFPage[];
  activePage: number;
  onUpdateElement: (pageIndex: number, elementId: string, updates: Partial<PDFElement>) => void;
  onDeleteElement: (pageIndex: number, elementId: string) => void;
  onAddElement: (pageIndex: number, element: PDFElement) => void;
  onAddPage: () => void;
}

const getPageDimensions = (format: string) => {
  switch (format) {
    case "A4":
      return { width: 595, height: 842 }; // A4 in points
    case "A5":
      return { width: 420, height: 595 }; // A5 in points
    case "Letter":
      return { width: 612, height: 792 }; // Letter in points
    default:
      return { width: 595, height: 842 };
  }
};

export const PDFCanvas = ({
  pages,
  activePage,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  onAddPage
}: PDFCanvasProps) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<{ [key: number]: boolean }>({});

  const getPageDimensions = (format: string) => {
    switch (format) {
      case "A4":
        return { width: 595, height: 842 }; // A4 in points
      case "A5":
        return { width: 420, height: 595 }; // A5 in points
      case "Letter":
        return { width: 612, height: 792 }; // Letter in points
      default:
        return { width: 595, height: 842 };
    }
  };

  const scale = 0.75; // Scale factor for display

  const handleDragOver = useCallback((e: React.DragEvent, pageIndex: number) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [pageIndex]: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, pageIndex: number) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [pageIndex]: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, pageIndex: number) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [pageIndex]: false }));

    const elementType = e.dataTransfer.getData("text/plain") as ElementType;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newElement: PDFElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      x: Math.max(0, x - 75), // Center the element
      y: Math.max(0, y - 20),
      width: elementType === "checkbox" ? 20 : 150,
      height: elementType === "text" || elementType === "select" ? 40 : elementType === "checkbox" ? 20 : 60,
      required: false,
      placeholder: `Enter ${elementType}...`,
    };
    
    onAddElement(pageIndex, newElement);
    toast(`${elementType.charAt(0).toUpperCase() + elementType.slice(1)} field added to page ${pageIndex + 1}`);
  }, [scale, onAddElement]);

  const handleElementDrag = useCallback((pageIndex: number, elementId: string, deltaX: number, deltaY: number) => {
    const page = pages[pageIndex];
    const pageDimensions = getPageDimensions(page?.format || "A4");
    onUpdateElement(pageIndex, elementId, {
      x: Math.max(0, Math.min(pageDimensions.width - 150, deltaX / scale)),
      y: Math.max(0, Math.min(pageDimensions.height - 40, deltaY / scale)),
    });
  }, [scale, pages, onUpdateElement]);


  const totalElements = pages.reduce((sum, page) => sum + page.elements.length, 0);

  if (!pages || pages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="text-center text-muted-foreground">
          <p>No pages available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface">
      {/* Canvas Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {totalElements} form {totalElements === 1 ? 'field' : 'fields'} across {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </div>
        </div>
        
      </div>

      {/* Canvas Area - All Pages Stacked */}
      <div className="flex-1 overflow-auto p-8 bg-surface">
        <div className="flex flex-col items-center space-y-8">
          {pages.map((page, pageIndex) => {
            const pageDimensions = getPageDimensions(page?.format || "A4");
            const displayWidth = pageDimensions.width * scale;
            const displayHeight = pageDimensions.height * scale;
            const isPageDragOver = isDragOver[pageIndex] || false;

            return (
              <div key={page.id} className="relative">
                {/* Page Number Label */}
                <div className="absolute -top-6 left-0 text-sm text-muted-foreground">
                  Page {pageIndex + 1}
                </div>
                
                {/* PDF Page */}
                <div className={`relative bg-card shadow-lg rounded-lg overflow-hidden border border-pdf-border ${
                  pageIndex === activePage ? 'ring-2 ring-primary ring-opacity-50' : ''
                }`}>
                  <div
                    className={`relative bg-white transition-all duration-200 ${
                      isPageDragOver ? "bg-drop-active ring-2 ring-primary" : ""
                    }`}
                    style={{
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                    }}
                    onDragOver={(e) => handleDragOver(e, pageIndex)}
                    onDragLeave={(e) => handleDragLeave(e, pageIndex)}
                    onDrop={(e) => handleDrop(e, pageIndex)}
                    onClick={() => {
                      setSelectedElement(null);
                      setSelectedPage(pageIndex);
                    }}
                  >
                    {/* PDF Background or Blank Canvas */}
                    {page.backgroundImage ? (
                      <PDFRenderer
                        fileUrl={page.backgroundImage}
                        width={displayWidth}
                        height={displayHeight}
                        pageNumber={(page as any).pageNumber || pageIndex + 1}
                        className="absolute inset-0"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-white" />
                    )}

                    {/* Grid pattern for alignment */}
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                        `,
                        backgroundSize: `${20 * scale}px ${20 * scale}px`,
                      }}
                    />

                    {/* Form Elements */}
                    {page.elements.map((element) => (
                      <PDFElementComponent
                        key={element.id}
                        element={element}
                        scale={scale}
                        isSelected={selectedElement === element.id}
                        onSelect={() => {
                          setSelectedElement(element.id);
                          setSelectedPage(pageIndex);
                        }}
                        onDrag={(deltaX, deltaY) => handleElementDrag(pageIndex, element.id, deltaX, deltaY)}
                        onUpdate={(updates) => onUpdateElement(pageIndex, element.id, updates)}
                        onDelete={() => onDeleteElement(pageIndex, element.id)}
                      />
                    ))}

                    {/* Drop zone indicator */}
                    {isPageDragOver && (
                      <div className="absolute inset-0 bg-drop-active/20 border-2 border-dashed border-primary flex items-center justify-center">
                        <div className="text-primary font-medium">Drop element here</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Page Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={onAddPage}
            className="border-dashed border-2 hover:border-primary hover:bg-primary/5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Page
          </Button>
        </div>
      </div>
    </div>
  );
};