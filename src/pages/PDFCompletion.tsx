import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFRenderer } from "@/components/pdf-builder/PDFRenderer";
import { InteractivePDFElement } from "@/components/pdf-builder/InteractivePDFElement";
import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { ArrowLeft, FileCheck, Download, Eye, EyeOff } from "lucide-react";

interface FormData {
  [elementId: string]: string | boolean;
}

const PDFCompletionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [allElements, setAllElements] = useState<PDFElement[]>([]);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('pdfBuilderData');
    console.log('Raw stored data:', storedData);
    console.log('Navigation state:', location.state);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        let pagesData = data.pages || [];
        
        console.log('Pages data in completion:', pagesData);
        console.log('First page background:', pagesData[0]?.backgroundImage);
        setPages(pagesData);
        
        // Collect all form elements from all pages
        const elements: PDFElement[] = [];
        pagesData.forEach((page: PDFPage) => {
          elements.push(...page.elements);
        });
        setAllElements(elements);
        
        // Initialize form data
        const initialFormData: FormData = {};
        elements.forEach(element => {
          initialFormData[element.id] = element.type === 'checkbox' ? false : '';
        });
        setFormData(initialFormData);
        
      } catch (error) {
        console.error('Error parsing stored PDF builder data:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate, location.state]);

  const handleInputChange = (elementId: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const handleComplete = () => {
    toast.success("PDF completed successfully!");
    // Here you would typically save the completed PDF or send it somewhere
    console.log("Completed form data:", formData);
  };

  const downloadPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Find the specific page container
        const pageContainer = document.querySelector(`[data-page-index="${pageIndex}"]`);
        if (pageContainer) {
          const canvas = await html2canvas(pageContainer as HTMLElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate dimensions to fit page
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * pageWidth) / canvas.width;
          
          // Add image to PDF
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        }
      }
      
      // Download PDF
      pdf.save(`completed-form-${Date.now()}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download PDF");
    }
  };

  const getCompletionProgress = () => {
    const completedFields = allElements.filter(element => {
      const value = formData[element.id];
      return value !== "" && value !== false && value !== null && value !== undefined;
    }).length;
    return Math.round((completedFields / allElements.length) * 100);
  };

  if (pages.length === 0 || allElements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No form elements found</h2>
          <p className="text-muted-foreground mb-4">Please go back and add some form elements to your PDF.</p>
          <Button onClick={() => navigate('/pdf-builder')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Builder
          </Button>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/pdf-builder')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Complete PDF Form</h1>
              <p className="text-sm text-muted-foreground">
                Click directly on the PDF to fill out fields
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowOverlay(!showOverlay)}
              className="flex items-center gap-2"
            >
              {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOverlay ? 'Hide Fields' : 'Show Fields'}
            </Button>
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={getCompletionProgress()} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {getCompletionProgress()}% completed ({allElements.filter(el => formData[el.id] && formData[el.id] !== false).length} of {allElements.length} fields)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF with Interactive Elements */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive PDF</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on the highlighted areas to fill out the form
                </p>
              </CardHeader>
              <CardContent>
                <div className="pdf-renderer-container relative border rounded-lg bg-gray-50 overflow-hidden">
                  {pages.length > 0 ? (
                    <div className="space-y-8 p-4">
                      {pages.map((page, pageIndex) => (
                        <div key={page.id} className="relative" data-page-index={pageIndex}>
                          {/* Page Number Label */}
                          {pages.length > 1 && (
                            <div className="absolute -top-6 left-0 text-sm text-muted-foreground">
                              Page {pageIndex + 1}
                            </div>
                          )}
                          
                           <div className="relative bg-white shadow-lg rounded-lg overflow-hidden" style={{ minHeight: '750px' }}>
                             {page.backgroundImage ? (
                               typeof page.backgroundImage === 'string' && page.backgroundImage.startsWith('data:image/') ? (
                                 // Rendered DOCX page as image
                                 <img 
                                   src={page.backgroundImage}
                                   alt={`Page ${pageIndex + 1}`}
                                   className="w-full h-full object-contain bg-white"
                                 />
                               ) : typeof page.backgroundImage === 'string' && (page.backgroundImage.startsWith('blob:') || page.backgroundImage.startsWith('http')) ? (
                                 // Blob URL or HTTP URL for PDF
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                                   fileUrl={page.backgroundImage}
                                   width={600}
                                   height={750}
                                   pageNumber={pageIndex + 1}
                                   className="w-full"
                                 />
                               ) : typeof page.backgroundImage === 'string' && (page.backgroundImage.startsWith('blob:') || page.backgroundImage.startsWith('http')) ? (
                                 // Blob URL or HTTP URL for PDF
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                                   fileUrl={page.backgroundImage}
                                   width={600}
                                   height={750}
                                   pageNumber={pageIndex + 1}
                                   className="w-full"
                                 />
                               ) : page.backgroundImage instanceof File ? (
                                 // File object (PDF or other file)
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}-${page.backgroundImage.name}`}
                                   fileUrl={page.backgroundImage}
                                   width={600}
                                   height={750}
                                   pageNumber={pageIndex + 1}
                                   className="w-full"
                                 />
                               ) : typeof page.backgroundImage === 'string' && page.backgroundImage.startsWith('/') ? (
                                 // PDF file path - create a new URL for each page
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                                   fileUrl={`${page.backgroundImage}#page=${pageIndex + 1}`}
                                   width={600}
                                   height={750}
                                   pageNumber={pageIndex + 1}
                                   className="w-full"
                                 />
                               ) : (
                                 // Other string format
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}`}
                                   fileUrl={page.backgroundImage}
                                   width={600}
                                   height={750}
                                   pageNumber={pageIndex + 1}
                                   className="w-full"
                                 />
                               )
                             ) : (
                               <div className="w-full h-[750px] bg-white border border-gray-200 rounded flex items-center justify-center">
                                 <div className="text-center text-muted-foreground">
                                   <p>Page {pageIndex + 1}</p>
                                   <p className="text-sm">No background image</p>
                                 </div>
                               </div>
                             )}
                            
                            {/* Interactive Elements Overlay */}
                            {page.elements.map((element) => (
                              <InteractivePDFElement
                                key={element.id}
                                element={element}
                                scale={600 / 595} // A4 width scale factor
                                value={formData[element.id] || ''}
                                onUpdate={(value) => handleInputChange(element.id, value)}
                                isActive={activeElement === element.id}
                                onActivate={() => setActiveElement(element.id)}
                                hideOverlay={!showOverlay}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[750px] text-muted-foreground">
                      <div className="text-center">
                        <p className="text-lg mb-2">No PDF uploaded</p>
                        <p className="text-sm">Please go back and upload a PDF file first.</p>
                        <Button 
                          onClick={() => navigate('/pdf-builder')} 
                          className="mt-4"
                          variant="outline"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Builder
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fields Overview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your progress
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allElements.map((element, index) => {
                    const hasValue = formData[element.id] && formData[element.id] !== false;
                    return (
                      <div
                        key={element.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          activeElement === element.id 
                            ? 'bg-primary/10 border-primary' 
                            : hasValue
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveElement(element.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            hasValue 
                              ? 'bg-green-500 text-white' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {hasValue ? '✓' : index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {element.type}
                            </p>
                            {element.placeholder && (
                              <p className="text-xs text-muted-foreground">
                                {element.placeholder}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs">
                          {hasValue ? '✅' : '⏳'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {getCompletionProgress() === 100 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      🎉 All fields completed!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      You can now download or submit your PDF.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFCompletionPage;