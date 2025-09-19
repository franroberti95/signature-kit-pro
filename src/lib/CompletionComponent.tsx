import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFRenderer } from "@/components/pdf-builder/PDFRenderer";
import { InteractivePDFElement } from "@/components/pdf-builder/InteractivePDFElement";
import { MobileFieldNavigation } from "@/components/pdf-builder/MobileFieldNavigation";
import { PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { ArrowLeft, Download, Eye, EyeOff } from "lucide-react";

interface FormData {
  [elementId: string]: string | boolean;
}

interface CompletionComponentProps {
  pages: PDFPage[];
  onBack?: () => void;
  onComplete?: (formData: FormData) => void;
  onDownload?: (formData: FormData) => Promise<void>;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const CompletionComponent = ({
  pages: initialPages,
  onBack,
  onComplete,
  onDownload,
  showBackButton = true,
  title = "Complete PDF Form",
  subtitle = "Click directly on the PDF to fill out fields",
  className = "",
}: CompletionComponentProps) => {
  const [pages, setPages] = useState<PDFPage[]>(initialPages);
  const [formData, setFormData] = useState<FormData>({});
  const [allElements, setAllElements] = useState<PDFElement[]>([]);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    setPages(initialPages);
    
    // Collect all form elements from all pages
    const elements: PDFElement[] = [];
    initialPages.forEach((page: PDFPage) => {
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
  }, [initialPages]);

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(`pdf-element-${elementId}`);
    if (!element) return;

    const headerHeight = 80;
    const mobileNavHeight = isMobile ? 280 : 0;
    const padding = 20;
    
    // Get element's position relative to the document
    const elementTop = element.offsetTop;
    
    // Calculate where to scroll to show the element clearly
    const targetScrollTop = elementTop - headerHeight - padding;
    
    // Scroll to the calculated position
    window.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
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
  };

  const handleDownload = async () => {
    if (onDownload) {
      setIsDownloading(true);
      try {
        await onDownload(formData);
        toast.success("PDF downloaded successfully!");
      } catch (error) {
        console.error('Download error:', error);
        toast.error("Failed to download PDF");
      } finally {
        setIsDownloading(false);
      }
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
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No form elements found</h2>
          <p className="text-muted-foreground mb-4">Please provide PDF pages with form elements.</p>
          {showBackButton && onBack && (
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <header className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {isMobile ? 'Back' : 'Back'}
              </Button>
            )}
            <div>
              <h1 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
                {title}
              </h1>
              {!isMobile && subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
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
              {onDownload && (
                <Button 
                  onClick={handleDownload} 
                  variant="default"
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
              )}
            </div>
          )}
          {isMobile && onDownload && (
            <Button 
              onClick={handleDownload} 
              size="sm" 
              variant="outline"
              disabled={isDownloading}
            >
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
                              style={{ minHeight: '842px' }}
                            >
                              {page.backgroundImage && (
                                <PDFRenderer
                                  key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                                  fileUrl={page.backgroundImage}
                                  width={600}
                                  height={842}
                                  pageNumber={pageIndex + 1}
                                  className="w-full"
                                />
                              )}
                              {/* Interactive Elements Overlay */}
                              {page.elements.map((element) => (
                                <div
                                  key={element.id}
                                  id={`pdf-element-${element.id}`}
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
                                    showHighlight={activeElement === element.id}
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
                          <p className="text-lg mb-2">No PDF provided</p>
                          <p className="text-sm">Please provide PDF pages with background images.</p>
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
                          {page.backgroundImage && (
                            <PDFRenderer
                              key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                              fileUrl={page.backgroundImage}
                              width={350}
                              height={500}
                              pageNumber={pageIndex + 1}
                              className="w-full"
                            />
                          )}
                          {/* Interactive Elements Overlay */}
                          {page.elements.map((element) => (
                            <div
                              key={element.id}
                              id={`pdf-element-${element.id}`}
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
                      <p className="text-lg mb-2">No PDF provided</p>
                      <p className="text-sm">Please provide PDF pages with background images.</p>
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

        {/* Field Navigation Stepper */}
        <div className="h-64 md:h-48" /> {/* Spacer for bottom navigation */}
        <MobileFieldNavigation
          elements={allElements}
          currentIndex={currentFieldIndex}
          onNavigate={handleNavigateToField}
          formData={formData}
          onFieldUpdate={handleInputChange}
          onDownload={onDownload ? handleDownload : undefined}
        />
      </div>
    </div>
  );
};
