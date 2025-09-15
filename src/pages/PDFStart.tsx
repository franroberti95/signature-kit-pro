import { useNavigate } from "react-router-dom";
import { FormatSelector } from "@/components/pdf-builder/FormatSelector";
import { FileUploader } from "@/components/pdf-builder/FileUploader";
import { PDFFormat } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";

const PDFStart = () => {
  const navigate = useNavigate();

  const handleFormatSelect = (format: PDFFormat) => {
    // Store the selected format and navigate to builder
    const newPage = {
      id: `page-${Date.now()}`,
      format,
      elements: [],
    };
    
    // Store in sessionStorage for the builder page
    sessionStorage.setItem('pdfBuilderData', JSON.stringify({
      pages: [newPage],
      activePage: 0,
      selectedFormat: format
    }));
    
    toast(`New ${format} document created!`);
    navigate('/pdf-builder');
  };

  const handleFileUpload = (file: File) => {
    // Store the uploaded file and navigate to builder
    const newPage = {
      id: `page-${Date.now()}`,
      format: "A4", // Default, would be detected from uploaded PDF
      elements: [],
      backgroundImage: file,
    };
    
    // Store in sessionStorage for the builder page
    sessionStorage.setItem('pdfBuilderData', JSON.stringify({
      pages: [newPage],
      activePage: 0,
      selectedFormat: "A4",
      hasUploadedFile: true
    }));
    
    // Store the actual file in a global variable or use a different approach
    // Since File objects can't be JSON serialized, we'll pass it via navigation state
    toast(`PDF "${file.name}" loaded successfully!`);
    navigate('/pdf-builder', { state: { uploadedFile: file } });
  };

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
};

export default PDFStart;