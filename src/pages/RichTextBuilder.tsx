import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RichTextEditor from "@/components/pdf-builder/RichTextEditor";
import { PDFFormat } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { Plus, X, Variable } from "lucide-react";

const RichTextBuilderPage = () => {
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");
  const [content, setContent] = useState("");
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState("");
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

  const handleDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const addNewVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      const updated = [...variables, newVariable.trim()];
      setVariables(updated);
      updateStoredData(content, updated);
      setNewVariable("");
      setShowVariableModal(false);
    }
  };

  const removeVariable = (variable: string) => {
    const updated = variables.filter(v => v !== variable);
    setVariables(updated);
    updateStoredData(content, updated);
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
        {/* Variables Sidebar */}
        <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Variables</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowVariableModal(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Drag variables into your document
            </p>
            
            <div className="space-y-2">
              {variables.map((variable) => (
                <div
                  key={variable}
                  draggable
                  onDragStart={(e) => handleDragStart(e, variable)}
                  className="group flex items-center justify-between p-2 bg-background border border-border rounded-md cursor-grab hover:bg-accent hover:border-accent-foreground/20 active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2">
                    <Variable className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">{variable}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeVariable(variable)}
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            {variables.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No variables yet. Add one to get started.
              </p>
            )}
          </div>
        </div>

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

      {/* Add Variable Modal */}
      <Dialog open={showVariableModal} onOpenChange={setShowVariableModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Variable</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Variable Name</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter variable name..."
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewVariable()}
                />
                <Button onClick={addNewVariable} disabled={!newVariable.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextBuilderPage;