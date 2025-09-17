import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToolbarPanel } from "@/components/pdf-builder/ToolbarPanel";
import { PDFCanvas } from "@/components/pdf-builder/PDFCanvas";
import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";

const PDFBuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('pdfBuilderData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        let pagesData = data.pages || [];
        
        // Handle uploaded files
        if (location.state?.uploadedFile && data.hasUploadedFile) {
            // Handle PDF files normally
            pagesData = pagesData.map((page: PDFPage) => ({
              ...page,
              backgroundImage: location.state.uploadedFile
            }));
        }
        
        setPages(pagesData);
        setSelectedFormat(data.selectedFormat || "A4");
      } catch (error) {
        console.error('Error parsing stored PDF builder data:', error);
        // Redirect back to start if data is corrupted
        navigate('/');
      }
    } else {
      // No data found, redirect to start
      navigate('/');
    }
  }, [navigate, location.state]);

  const addElement = (type: ElementType) => {
    if (pages.length === 0) return;
    
    const newElement: PDFElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: type === "checkbox" ? 20 : type === "richtext" ? 400 : 150,
      height: type === "text" || type === "select" ? 40 : type === "checkbox" ? 20 : type === "richtext" ? 200 : 60,
      required: false,
      placeholder: `Enter ${type}...`,
    };

    const updatedPages = [...pages];
    // Add to the first page by default
    updatedPages[0].elements.push(newElement);
    setPages(updatedPages);
    updateStoredData(updatedPages);
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
      updateStoredData(updatedPages);
    }
  };

  const deleteElement = (pageIndex: number, elementId: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].elements = updatedPages[pageIndex].elements.filter(
      el => el.id !== elementId
    );
    setPages(updatedPages);
    updateStoredData(updatedPages);
    toast("Element removed");
  };

  const addPage = () => {
    const newPage: PDFPage = {
      id: `page-${Date.now()}`,
      format: pages[0]?.format || selectedFormat,
      elements: [],
    };
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    updateStoredData(updatedPages);
    toast("New page added");
  };

  const updateStoredData = (updatedPages: PDFPage[]) => {
    console.log('Updating stored data:', { pages: updatedPages });
    sessionStorage.setItem('pdfBuilderData', JSON.stringify({
      pages: updatedPages,
      selectedFormat
    }));
  };

  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading PDF Builder...</h2>
          <p className="text-muted-foreground">If this takes too long, please go back and start again.</p>
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
              {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {selectedFormat}
            </p>
          </div>
            <Button onClick={() => {
              console.log('Navigating to completion with current pages:', pages);
              updateStoredData(pages);
              navigate('/pdf-completion');
            }} className="bg-green-600 hover:bg-green-700">
              Continue to Form Completion
            </Button>
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
            updateStoredData(updatedPages);
          }}
          onAddPage={addPage}
        />
      </div>
    </div>
  );
};

export default PDFBuilderPage;