import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/pdf-builder/RichTextEditor";
import { PDFFormat } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";

const RichTextBuilderPage = () => {
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState<string[]>([
    "Full Name",
    "Email Address", 
    "Phone Number",
    "Date",
    "Signature",
    "Company Name",
    "Address",
    "City",
    "State",
    "Zip Code"
  ]);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('richTextBuilderData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setSelectedFormat(data.selectedFormat || "A4");
        setContent(data.content || "");
        setVariables(data.variables || [
          "Full Name",
          "Email Address", 
          "Phone Number",
          "Date",
          "Signature",
          "Company Name",
          "Address",
          "City",
          "State",
          "Zip Code"
        ]);
      } catch (error) {
        console.error('Error parsing stored rich text builder data:', error);
        navigate('/');
      }
    } else {
      // No data found, redirect to start
      navigate('/');
    }
  }, [navigate]);

  const updateStoredData = (newContent: string, newVariables: string[]) => {
    sessionStorage.setItem('richTextBuilderData', JSON.stringify({
      selectedFormat,
      content: newContent,
      variables: newVariables
    }));
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateStoredData(newContent, variables);
  };

  const handleVariablesChange = (newVariables: string[]) => {
    setVariables(newVariables);
    updateStoredData(content, newVariables);
  };

  const getPageDimensions = (format: PDFFormat) => {
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

  const handleContinue = () => {
    // Create PDF builder data with rich text as background
    const newPage = {
      id: `page-${Date.now()}`,
      format: selectedFormat,
      elements: [],
      richTextContent: content,
      richTextVariables: variables
    };
    
    sessionStorage.setItem('pdfBuilderData', JSON.stringify({
      pages: [newPage],
      selectedFormat,
      isRichTextDocument: true
    }));
    
    toast("Document ready for form completion!");
    navigate('/pdf-completion');
  };

  const scale = 0.75;
  const pageDimensions = getPageDimensions(selectedFormat);
  const displayWidth = pageDimensions.width * scale;
  const displayHeight = pageDimensions.height * scale;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Rich Text Document Builder</h1>
            <p className="text-sm text-muted-foreground">
              Create your document content • {selectedFormat} format
            </p>
          </div>
          <Button 
            onClick={handleContinue}
            className="bg-green-600 hover:bg-green-700"
          >
            Continue to Form Completion
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-surface">
          <div className="flex flex-col items-center">
            {/* Page Container */}
            <div className="relative">
              <div className="absolute -top-6 left-0 text-sm text-muted-foreground">
                Page 1
              </div>
              
              {/* PDF Page with Rich Text Editor */}
              <div 
                className="relative bg-white shadow-lg rounded-lg overflow-hidden border border-pdf-border"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                }}
              >
                <div className="absolute inset-4 z-10">
                  <RichTextEditor
                    value={content}
                    onChange={handleContentChange}
                    variables={variables}
                    onVariablesChange={handleVariablesChange}
                    placeholder="Start typing your document content here... You can format text and insert variables."
                    className="h-full"
                  />
                </div>
                
                {/* Grid pattern for alignment */}
                <div 
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * scale}px ${20 * scale}px`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextBuilderPage;