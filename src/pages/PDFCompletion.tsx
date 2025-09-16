import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFRenderer } from "@/components/pdf-builder/PDFRenderer";
import { InteractivePDFElement } from "@/components/pdf-builder/InteractivePDFElement";
import { MobileFieldNavigation } from "@/components/pdf-builder/MobileFieldNavigation";

import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { ArrowLeft, FileCheck, Download, Eye, EyeOff, Edit } from "lucide-react";

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
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  
  const [showOverlay, setShowOverlay] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const elementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('pdfBuilderData');
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        let pagesData = data.pages || [];
        
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
        
        // Focus first element if mobile
        if (elements.length > 0) {
          setActiveElement(elements[0].id);
          if (window.innerWidth < 768) {
            setTimeout(() => scrollToElement(elements[0].id), 500);
          }
        }
        
      } catch (error) {
        console.error('Error parsing stored PDF builder data:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate, location.state]);

  const scrollToElement = (elementId: string) => {
    const elementRef = elementRefs.current[elementId];
    if (elementRef) {
      // On mobile, account for bottom navigation height (approximately 300px now that input is always shown)
      const block = isMobile ? 'start' : 'center';
      const topOffset = isMobile ? 200 : 0;
      
      elementRef.scrollIntoView({ 
        behavior: 'smooth', 
        block,
        inline: 'center'
      });
      
      // Additional offset for mobile to account for bottom navigation
      if (isMobile) {
        setTimeout(() => {
          window.scrollBy(0, -topOffset);
        }, 100);
      }
    }
  };

  const handleInputChange = (elementId: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const handleNavigateToField = (index: number) => {
    if (index >= 0 && index < allElements.length) {
      setCurrentFieldIndex(index);
      const element = allElements[index];
      setActiveElement(element.id);
      scrollToElement(element.id);
    }
  };

  const handleElementClick = (elementId: string) => {
    setActiveElement(elementId);
    const elementIndex = allElements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      setCurrentFieldIndex(elementIndex);
    }
    
    // Mobile field navigation will handle editing
  };


  const handleComplete = () => {
    toast.success("PDF completed successfully!");
    // Here you would typically save the completed PDF or send it somewhere
    console.log("Completed form data:", formData);
  };

  const downloadPDF = async () => {
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      
      // Check if we have an original PDF to work with
      const firstPage = pages[0];
      let pdfDoc: any;
      
      if (firstPage?.backgroundImage && typeof firstPage.backgroundImage === 'string' && firstPage.backgroundImage.startsWith('blob:')) {
        // Load the original PDF
        const response = await fetch(firstPage.backgroundImage);
        const existingPdfBytes = await response.arrayBuffer();
        pdfDoc = await PDFDocument.load(existingPdfBytes);
      } else {
        // Create new PDF if no original PDF
        pdfDoc = await PDFDocument.create();
      }
      
      const pdfPages = pdfDoc.getPages();
      
      // Process each page
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        let pdfPage;
        
        if (pageIndex < pdfPages.length) {
          // Use existing page from original PDF
          pdfPage = pdfPages[pageIndex];
        } else {
          // Add new page if we have more pages than the original
          pdfPage = pdfDoc.addPage();
        }
        
        const { width, height } = pdfPage.getSize();
        
        // Add form fields as overlays
        for (const element of page.elements) {
          const value = formData[element.id];
          if (value && String(value) !== 'false') {
            // Calculate position (convert from pixels to PDF coordinates)
            const x = (element.x / 595) * width;
            const y = height - ((element.y + (element.height || 20)) / 842) * height; // PDF coordinates are bottom-up
            
            if (element.type === 'signature' && typeof value === 'string' && value.startsWith('data:image/')) {
              try {
                // Convert base64 to PNG bytes
                const base64Data = value.split(',')[1];
                const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                const pngImage = await pdfDoc.embedPng(imgBytes);
                
                const imgWidth = (element.width || 100) / 595 * width;
                const imgHeight = (element.height || 50) / 842 * height;
                
                pdfPage.drawImage(pngImage, {
                  x,
                  y,
                  width: imgWidth,
                  height: imgHeight,
                });
              } catch (error) {
                console.error('Error adding signature:', error);
                // Fallback to text
                pdfPage.drawText('[Signature]', {
                  x,
                  y,
                  size: 12,
                  color: rgb(0, 0, 0),
                });
              }
            } else if (element.type === 'checkbox' && value === true) {
              pdfPage.drawText('☑', {
                x,
                y,
                size: 14,
                color: rgb(0, 0, 0),
              });
            } else if (typeof value === 'string' && value.trim()) {
              pdfPage.drawText(value, {
                x,
                y,
                size: 12,
                color: rgb(0, 0, 0),
                maxWidth: (element.width || 100) / 595 * width,
              });
            }
          }
        }
      }
      
      // Generate PDF
      const pdfBytes = await pdfDoc.save();
      
      // Download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `completed-form-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download PDF: " + error.message);
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
              {isMobile ? 'Back' : 'Back to Builder'}
            </Button>
            <div>
              <h1 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
                Complete PDF Form
              </h1>
              {!isMobile && (
                <p className="text-sm text-muted-foreground">
                  Click directly on the PDF to fill out fields
                </p>
              )}
            </div>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowOverlay(!showOverlay)}
                className="flex items-center gap-2"
              >
                {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showOverlay ? 'Hide Fields' : 'Show Fields'}
              </Button>
              <Button onClick={downloadPDF} variant="default">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
          {isMobile && (
            <Button onClick={downloadPDF} size="sm" variant="outline">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className={`mx-auto p-6 ${isMobile ? 'pb-32' : 'max-w-7xl'}`}>
        {/* Progress Bar - Only show on desktop */}
        {!isMobile && (
          <div className="mb-6">
            <Progress value={getCompletionProgress()} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {getCompletionProgress()}% completed ({allElements.filter(el => formData[el.id] && formData[el.id] !== false).length} of {allElements.length} fields)
            </p>
          </div>
        )}

        <div className={isMobile ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
          {/* PDF with Interactive Elements */}
          <div className={isMobile ? "" : "lg:col-span-2"}>
            {!isMobile ? (
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
                            
                             <div 
                               className="relative bg-white shadow-lg rounded-lg overflow-hidden" 
                               style={{ minHeight: '750px' }}
                             >
                               {page.backgroundImage ? (
                                  typeof page.backgroundImage === 'string' && page.backgroundImage.startsWith('data:image/') ? (
                                    // Rendered page as image
                                    <img
                                     src={page.backgroundImage}
                                     alt={`Page ${pageIndex + 1}`}
                                     className="w-full h-full object-contain bg-white"
                                   />
                                 ) : typeof page.backgroundImage === 'string' && page.backgroundImage.startsWith('blob:') ? (
                                   // Blob URL for PDF
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
                                <div
                                  key={element.id}
                                  ref={(el) => elementRefs.current[element.id] = el}
                                >
                                   <InteractivePDFElement
                                     element={element}
                                     scale={600 / 595} // A4 width scale factor
                                     value={formData[element.id] || ''}
                                     onUpdate={(value) => handleInputChange(element.id, value)}
                                     isActive={activeElement === element.id}
                                     onActivate={() => handleElementClick(element.id)}
                                     hideOverlay={!showOverlay}
                                     isMobile={false}
                                   />
                                </div>
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
            ) : (
              // Mobile View
              <div className="pdf-renderer-container relative bg-gray-50 overflow-hidden">
                {pages.length > 0 ? (
                  <div className="space-y-8 p-2">
                    {pages.map((page, pageIndex) => (
                      <div key={page.id} className="relative" data-page-index={pageIndex}>
                         <div 
                           className="relative bg-white shadow-lg rounded overflow-hidden" 
                           style={{ minHeight: '600px' }}
                         >
                           {page.backgroundImage ? (
                              typeof page.backgroundImage === 'string' && page.backgroundImage.startsWith('data:image/') ? (
                                // Rendered page as image
                                <img
                                 src={page.backgroundImage}
                                 alt={`Page ${pageIndex + 1}`}
                                 className="w-full h-full object-contain bg-white"
                               />
                             ) : typeof page.backgroundImage === 'string' && page.backgroundImage.startsWith('blob:') ? (
                               // Blob URL for PDF
                               <PDFRenderer
                                 key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                                 fileUrl={page.backgroundImage}
                                 width={350}
                                 height={500}
                                 pageNumber={pageIndex + 1}
                                 className="w-full"
                               />
                             ) : page.backgroundImage instanceof File ? (
                                // File object (PDF or other file)
                                <PDFRenderer
                                  key={`pdf-page-${pageIndex}-${page.backgroundImage.name}`}
                                  fileUrl={page.backgroundImage}
                                  width={350}
                                  height={500}
                                  pageNumber={pageIndex + 1}
                                  className="w-full"
                                />
                              ) : (
                                // Other string format
                                <PDFRenderer
                                  key={`pdf-page-${pageIndex}`}
                                  fileUrl={page.backgroundImage}
                                  width={350}
                                  height={500}
                                  pageNumber={pageIndex + 1}
                                  className="w-full"
                                />
                              )
                            ) : (
                              <div className="w-full h-[500px] bg-white border border-gray-200 rounded flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                  <p>Page {pageIndex + 1}</p>
                                  <p className="text-sm">No background image</p>
                                </div>
                              </div>
                            )}
                          {/* Interactive Elements Overlay */}
                          {page.elements.map((element) => (
                            <div
                              key={element.id}
                              ref={(el) => elementRefs.current[element.id] = el}
                            >
                              <InteractivePDFElement
                                element={element}
                                scale={350 / 595} // A4 width scale factor for mobile
                                value={formData[element.id] || ''}
                                onUpdate={(value) => handleInputChange(element.id, value)}
                                isActive={activeElement === element.id}
                                onActivate={() => handleElementClick(element.id)}
                                hideOverlay={!showOverlay}
                                isMobile={true}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
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
            )}
          </div>

          {/* Fields Overview - Desktop Only */}
          {!isMobile && (
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
                          onClick={() => handleElementClick(element.id)}
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
          )}
        </div>

        {/* Mobile Field Navigation */}
        {isMobile && (
          <>
            <div className="h-80" /> {/* Spacer for mobile navigation */}
            <MobileFieldNavigation
              elements={allElements}
              currentIndex={currentFieldIndex}
              onNavigate={handleNavigateToField}
              formData={formData}
              onFieldUpdate={handleInputChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PDFCompletionPage;