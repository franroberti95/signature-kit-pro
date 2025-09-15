import { useState } from "react";
import { FormatSelector } from "./FormatSelector";
import { ToolbarPanel } from "./ToolbarPanel";
import { PDFCanvas } from "./PDFCanvas";
import { FileUploader } from "./FileUploader";
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
  backgroundImage?: string;
}

const PDFBuilder = () => {
  const [currentStep, setCurrentStep] = useState<"format" | "upload" | "build">("format");
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [activePage, setActivePage] = useState<number>(0);
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");

  const handleFormatSelect = (format: PDFFormat) => {
    setSelectedFormat(format);
    const newPage: PDFPage = {
      id: `page-${Date.now()}`,
      format,
      elements: [],
    };
    setPages([newPage]);
    setActivePage(0);
    setCurrentStep("build");
    toast(`New ${format} document created!`);
  };

  const handleFileUpload = (file: File) => {
    // Handle PDF upload with proper file URL
    const fileUrl = URL.createObjectURL(file);
    const newPage: PDFPage = {
      id: `page-${Date.now()}`,
      format: "A4", // Default, would be detected from uploaded PDF
      elements: [],
      backgroundImage: fileUrl, // Use the file URL for PDF rendering
    };
    setPages([newPage]);
    setActivePage(0);
    setCurrentStep("build");
    toast(`PDF "${file.name}" loaded successfully!`);
  };

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

  const updateElement = (elementId: string, updates: Partial<PDFElement>) => {
    const updatedPages = [...pages];
    const elementIndex = updatedPages[activePage].elements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      updatedPages[activePage].elements[elementIndex] = {
        ...updatedPages[activePage].elements[elementIndex],
        ...updates,
      };
      setPages(updatedPages);
    }
  };

  const deleteElement = (elementId: string) => {
    const updatedPages = [...pages];
    updatedPages[activePage].elements = updatedPages[activePage].elements.filter(
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

  if (currentStep === "format") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">PDF Builder</h1>
          <p className="text-muted-foreground">Create fillable PDF documents with drag-and-drop ease</p>
        </header>
        
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Get Started</h2>
              <p className="text-lg text-muted-foreground">Choose how you want to create your PDF document</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Start from Blank</h3>
                <p className="text-muted-foreground mb-6">Create a new document from scratch with your preferred format</p>
                <FormatSelector onFormatSelect={handleFormatSelect} />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Upload Existing PDF</h3>
                <p className="text-muted-foreground mb-6">Add form fields to an existing PDF document</p>
                <FileUploader onFileUpload={handleFileUpload} />
              </div>
            </div>
          </div>
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
              Page {activePage + 1} of {pages.length} • {pages[activePage]?.format}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentStep("format")}
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
          page={pages[activePage]}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onAddElement={(element) => {
            const updatedPages = [...pages];
            updatedPages[activePage].elements.push(element);
            setPages(updatedPages);
          }}
          onAddPage={addPage}
          isLastPage={activePage === pages.length - 1}
        />
      </div>
    </div>
  );
};

export default PDFBuilder;