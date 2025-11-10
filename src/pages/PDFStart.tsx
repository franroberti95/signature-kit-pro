import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FileUploader } from "@/components/pdf-builder/FileUploader";
import { PDFFormat } from "@/components/pdf-builder/PDFBuilder";
import { ApiService } from "@/services/apiService";
import { toast } from "sonner";
import { PDFDocument } from 'pdf-lib';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";

const PDFStart = () => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);

  const handleCreateNew = () => {
    // Always use A4 format and navigate to rich text builder
    sessionStorage.setItem('richTextBuilderData', JSON.stringify({
      selectedFormat: "A4",
      content: "",
      interactiveElements: [],
      isRichTextDocument: true
    }));
    
    toast("New A4 document created!");
    navigate('/rich-text-builder');
  };

  const handleFileUpload = async (file: File) => {
    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Handle non-PDF file - send to backend for conversion
      await handleNonPdfUpload(file);
    } else if (file.type === 'application/pdf') {
      // Handle PDF file - detect page count and create pages
      try {
        const blobUrl = URL.createObjectURL(file);
        
        // Load the PDF to get page count
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();
        
        console.log(`PDF has ${pageCount} pages`);
        
        // Create page objects for each page in the PDF
        const newPages = Array.from({ length: pageCount }, (_, index) => ({
          id: `page-${Date.now()}-${index}`,
          format: "A4" as PDFFormat,
          elements: [],
          backgroundImage: blobUrl,
          originalFileName: file.name,
          pageNumber: index + 1 // PDFRenderer will use this to show the correct page
        }));
        
        // Store using ApiService for consistency
        await ApiService.savePDFBuilderData(newPages, "A4");
        
        toast(`PDF "${file.name}" loaded successfully! ${pageCount} pages detected.`);
        navigate('/pdf-builder');
      } catch (error) {
        console.error('Error processing PDF:', error);
        toast.error("Failed to process PDF file");
      }
    } else {
      toast.error("Please upload a PDF or DOCX file");
    }
  };

  const handleNonPdfUpload = async (file: File) => {
    setIsConverting(true);
    
    try {
      toast("Converting document to PDF...", { duration: 3000 });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // TODO: Replace with your actual backend endpoint
      const response = await fetch('/api/convert-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }
      
      // Get the converted PDF blob from the response
      const pdfBlob = await response.blob();
      
      // Load the PDF to get page count
      const pdfBytes = await pdfBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      
      console.log(`Converted PDF has ${pageCount} pages`);
      
      // Create a blob URL for the converted PDF
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Create page objects for each page in the PDF
      const newPages = Array.from({ length: pageCount }, (_, index) => ({
        id: `page-${Date.now()}-${index}`,
        format: "A4" as PDFFormat,
        elements: [],
        backgroundImage: blobUrl,
        originalFileName: file.name,
        pageNumber: index + 1
      }));
      
      // Store using ApiService for consistency
      await ApiService.savePDFBuilderData(newPages, "A4");
      
      toast(`Document converted to PDF successfully! "${file.name}" loaded with ${pageCount} pages.`, { 
        duration: 3000 
      });
      navigate('/pdf-builder');
      
    } catch (error) {
      console.error('Error converting file:', error);
      toast.error(`Failed to convert file: ${error.message}`);
    } finally {
      setIsConverting(false);
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
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Create New Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Start with a blank A4 document and build your form from scratch</p>
                <Button 
                  onClick={handleCreateNew} 
                  className="w-full"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create New A4 Document
                </Button>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Existing PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Add form fields to an existing PDF or Word document</p>
                <FileUploader onFileUpload={handleFileUpload} isConverting={isConverting} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFStart;