import { useState, useEffect } from "react";
import { ToolbarPanel } from "./ToolbarPanel";
import { PDFCanvas } from "./PDFCanvas";
import { toast } from "sonner";

export type PDFFormat = "A4" | "A5" | "Letter";
export type ElementType = "text" | "signature" | "date" | "checkbox" | "select" | "image";

export interface PDFElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select elements
}

export interface PDFPage {
  id: string;
  format: PDFFormat;
  elements: PDFElement[];
  backgroundImage?: string | File;
}

const PDFBuilder = () => {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [activePage, setActivePage] = useState<number>(0);
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");

  // Load data from sessionStorage on component mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('pdfBuilderData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        console.log('PDFBuilder: Loading data from sessionStorage:', data);
        setPages(data.pages || []);
        setActivePage(data.activePage || 0);
        setSelectedFormat(data.selectedFormat || "A4");
        
        // Log details about loaded pages
        if (data.pages) {
          console.log('PDFBuilder: Loaded pages:', data.pages.map(p => ({
            id: p.id,
            pageNumber: p.pageNumber,
            hasBackground: !!p.backgroundImage,
            backgroundUrl: typeof p.backgroundImage === 'string' ? p.backgroundImage.substring(0, 50) + '...' : 'File object'
          })));
        }
      } catch (error) {
        console.error('Error loading PDF builder data:', error);
        toast.error("Failed to load document data");
      }
    }
  }, []);

  const addElement = (type: ElementType) => {
    if (pages.length === 0) return;
    
    const newElement: PDFElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100 + Math.random() * 200, // Random initial position
      y: 100 + Math.random() * 200,
      width: type === "checkbox" ? 20 : 150,
      height: type === "text" || type === "select" ? 40 : type === "checkbox" ? 20 : 60,
      required: false,
      placeholder: `Enter ${type}...`,
    };

    const updatedPages = [...pages];
    updatedPages[activePage].elements.push(newElement);
    setPages(updatedPages);
    toast(`${type.charAt(0).toUpperCase() + type.slice(1)} field added`);
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
    toast("Element removed");
  };

  const addPage = () => {
    const newPage: PDFPage = {
      id: `page-${Date.now()}`,
      format: pages[0]?.format || selectedFormat,
      elements: [],
    };
    setPages([...pages, newPage]);
    setActivePage(pages.length);
    toast("New page added");
  };

  if (!pages || pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-foreground mb-2">No Document Found</h2>
          <p className="text-muted-foreground mb-4">Please start by creating or uploading a document</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-primary hover:underline"
          >
            ← Go Back to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">PDF Builder</h1>
            <p className="text-sm text-muted-foreground">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {pages[activePage]?.format}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Start
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <ToolbarPanel onAddElement={addElement} />
        <PDFCanvas
          pages={pages}
          activePage={activePage}
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

export default PDFBuilder;