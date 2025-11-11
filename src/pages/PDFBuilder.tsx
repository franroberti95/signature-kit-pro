import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToolbarPanel } from "@/components/pdf-builder/ToolbarPanel";
import { PDFCanvas } from "@/components/pdf-builder/PDFCanvas";
import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { usePreDefinedFields } from "@/hooks/usePreDefinedFields";
import { ApiService } from "@/services/apiService";
import { toast } from "sonner";

const PDFBuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");
  const [loading, setLoading] = useState(true);
  const { preDefinedFields, loading: fieldsLoading } = usePreDefinedFields();

  useEffect(() => {
    const loadPDFBuilderData = async () => {
      try {
        setLoading(true);
        // Try to load existing data from API service (sessionStorage)
        const storedData = await ApiService.getPDFBuilderData();
        
        if (storedData) {
          let pagesData = storedData.pages;
          
          // Handle uploaded files
          if (location.state?.uploadedFile) {
            pagesData = pagesData.map((page: PDFPage) => ({
              ...page,
              backgroundImage: location.state.uploadedFile
            }));
          }
          
          setPages(pagesData);
          setSelectedFormat(storedData.selectedFormat as PDFFormat);
          setLoading(false);
          return;
        }

        // If no stored data but we have uploaded file, create initial structure
        if (location.state?.uploadedFile) {
          const initialPage: PDFPage = {
            id: `page-${Date.now()}`,
            format: "A4",
            elements: [],
            backgroundImage: location.state.uploadedFile
          };
          const initialPages = [initialPage];
          setPages(initialPages);
          // Save the initial data using API service
          await ApiService.savePDFBuilderData(initialPages, "A4");
          setLoading(false);
          return;
        }

        // If no data exists and no uploaded file, redirect to start page
        navigate('/');
      } catch (error) {
        console.error('PDFBuilder: Error loading PDF builder data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadPDFBuilderData();
  }, [location, navigate]);

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
    // Add to the first page by default
    updatedPages[0].elements.push(newElement);
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
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    toast("New page added");
  };

  const updateStoredData = async (updatedPages: PDFPage[]) => {
    try {
      await ApiService.savePDFBuilderData(updatedPages, selectedFormat);
    } catch (error) {
      console.error('Error storing PDF builder data:', error);
    }
  };

  // Show loading state
  if (loading || fieldsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading PDF Builder...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your workspace.</p>
        </div>
      </div>
    );
  }

  // If no initial data found, will redirect in useEffect
  if (pages.length === 0) {
    return null;
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
            <Button onClick={async () => {
              await updateStoredData(pages);
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
          }}
          onAddPage={addPage}
          preDefinedFields={preDefinedFields}
        />
      </div>
    </div>
  );
};

export default PDFBuilderPage;