import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, Eye } from "lucide-react";
import { PDFPage, PDFElement, ElementType } from "./PDFBuilder";
import { PDFElementComponent } from "./PDFElementComponent";
import { toast } from "sonner";

interface PDFCanvasProps {
  page: PDFPage;
  onUpdateElement: (elementId: string, updates: Partial<PDFElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onAddElement: (element: PDFElement) => void;
  onAddPage: () => void;
  isLastPage: boolean;
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
  page,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  onAddPage,
  isLastPage
}: PDFCanvasProps) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const pageDimensions = getPageDimensions(page?.format || "A4");
  const scale = 0.75; // Scale factor for display
  const displayWidth = pageDimensions.width * scale;
  const displayHeight = pageDimensions.height * scale;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

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
    
    // Add element using the parent callback
    onAddElement(newElement);
    toast(`${elementType.charAt(0).toUpperCase() + elementType.slice(1)} field added to canvas`);
  }, [scale, onAddElement]);

  const handleElementDrag = useCallback((elementId: string, deltaX: number, deltaY: number) => {
    onUpdateElement(elementId, {
      x: Math.max(0, Math.min(pageDimensions.width - 150, deltaX / scale)),
      y: Math.max(0, Math.min(pageDimensions.height - 40, deltaY / scale)),
    });
  }, [scale, pageDimensions, onUpdateElement]);

  const handlePreview = () => {
    toast("Preview mode - showing how the form will look to signers");
  };

  const handleExport = () => {
    toast("Exporting PDF with form fields...");
  };

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="text-center text-muted-foreground">
          <p>No page selected</p>
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
            {page.elements.length} form {page.elements.length === 1 ? 'field' : 'fields'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="pdf-action" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 bg-surface">
        <div className="flex flex-col items-center space-y-6">
          {/* PDF Page */}
          <div className="relative bg-card shadow-lg rounded-lg overflow-hidden border border-pdf-border">
            <div
              className={`relative bg-white transition-all duration-200 ${
                isDragOver ? "bg-drop-active ring-2 ring-primary" : ""
              }`}
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => setSelectedElement(null)}
            >
              {/* Background Image (for uploaded PDFs) */}
              {page.backgroundImage && (
                <div className="absolute inset-0 bg-muted/10 flex items-center justify-center text-muted-foreground text-sm">
                  PDF Preview (Coming Soon)
                  {/* TODO: Implement PDF.js to render actual PDF pages */}
                </div>
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
                  onSelect={() => setSelectedElement(element.id)}
                  onDrag={(deltaX, deltaY) => handleElementDrag(element.id, deltaX, deltaY)}
                  onUpdate={(updates) => onUpdateElement(element.id, updates)}
                  onDelete={() => onDeleteElement(element.id)}
                />
              ))}

              {/* Drop zone indicator */}
              {isDragOver && (
                <div className="absolute inset-0 bg-drop-active/20 border-2 border-dashed border-primary flex items-center justify-center">
                  <div className="text-primary font-medium">Drop element here</div>
                </div>
              )}
            </div>
          </div>

          {/* Add Page Button */}
          {isLastPage && (
            <Button
              variant="outline"
              size="lg"
              onClick={onAddPage}
              className="border-dashed border-2 hover:border-primary hover:bg-primary/5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Page
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};