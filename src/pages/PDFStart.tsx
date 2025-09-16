import { useNavigate } from "react-router-dom";
import { FormatSelector } from "@/components/pdf-builder/FormatSelector";
import { FileUploader } from "@/components/pdf-builder/FileUploader";
import { PDFFormat } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { DocxToPdfConverter } from "@/utils/docxToPdfConverter";

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
    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Handle DOCX file - parse it first
      handleDocxUpload(file);
    } else if (file.type === 'application/pdf') {
      // Handle PDF file - convert to blob URL for persistence
      const blobUrl = URL.createObjectURL(file);
      
      const newPage = {
        id: `page-${Date.now()}`,
        format: "A4", // Default, would be detected from uploaded PDF
        elements: [],
        backgroundImage: blobUrl,
        originalFileName: file.name,
      };
      
      // Store in sessionStorage for the builder page
      sessionStorage.setItem('pdfBuilderData', JSON.stringify({
        pages: [newPage],
        activePage: 0,
        selectedFormat: "A4",
        hasUploadedFile: true,
        pdfBlobUrl: blobUrl // Store blob URL separately for cleanup
      }));
      
      toast(`PDF "${file.name}" loaded successfully!`);
      navigate('/pdf-builder');
    } else {
      toast.error("Please upload a PDF or DOCX file");
    }
  };

  const handleDocxUpload = async (file: File) => {
    try {
      toast("Converting DOCX to PDF...", { duration: 3000 });
      
      // Convert DOCX to PDF first
      const { pdfBlob, fileName, pageImages } = await DocxToPdfConverter.convertDocxToPdf(file);
      
      console.log(`Converted PDF has ${pageImages.length} pages with images`);
      
      // Create a blob URL for the converted PDF (for final export)
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Create page objects using the page images for display
      const newPages = pageImages.map((imageData, index) => ({
        id: `page-${Date.now()}-${index}`,
        format: "A4" as PDFFormat,
        elements: [],
        backgroundImage: imageData, // Use the page image directly
        originalFileName: fileName,
        pageNumber: index + 1,
        isFromDocx: true // Flag to identify DOCX-converted pages
      }));
      
      sessionStorage.setItem('pdfBuilderData', JSON.stringify({
        pages: newPages,
        activePage: 0,
        selectedFormat: "A4",
        hasUploadedFile: true,
        pdfBlobUrl: blobUrl, // Store for final export
        convertedFromDocx: true,
        totalPages: pageImages.length
      }));
      
      toast(`DOCX converted to PDF successfully! "${fileName}" loaded with ${pageImages.length} pages.`, { 
        duration: 3000 
      });
      navigate('/pdf-builder');
      
    } catch (error) {
      console.error('Error converting DOCX:', error);
      toast.error("Failed to convert DOCX file: " + error.message);
    }
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
              <h3 className="text-xl font-semibold text-foreground">Upload Existing Document</h3>
              <p className="text-muted-foreground mb-6">Add form fields to an existing PDF or Word document</p>
              <FileUploader onFileUpload={handleFileUpload} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFStart;