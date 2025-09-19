import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFRenderer } from "@/components/pdf-builder/PDFRenderer";
import { InteractivePDFElement } from "@/components/pdf-builder/InteractivePDFElement";
import { MobileFieldNavigation } from "@/components/pdf-builder/MobileFieldNavigation";
import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { useFormCompletion } from "@/hooks/useFormCompletion";
import { ApiService } from "@/services/apiService";
import { toast } from "sonner";
import { ArrowLeft, FileCheck, Download, Eye, EyeOff, Edit } from "lucide-react";

interface FormData {
  [elementId: string]: string | boolean;
}

interface CompletionComponentProps {
  // Data source
  sessionStorageKey: string;
  dataValidator: (data: any) => boolean;
  dataExtractor: (data: any) => { pages: PDFPage[], elements: PDFElement[] };
  
  // Navigation
  backRoute: string;
  backButtonText: string;
  
  // UI texts
  title: string;
  subtitle?: string;
  
  // Download handler
  onDownload: (pages: PDFPage[], formData: FormData) => Promise<void>;
  
  // Optional completion handler
  onComplete?: (formData: FormData) => void;
}

export const CompletionComponent = ({
  sessionStorageKey,
  dataValidator,
  dataExtractor,
  backRoute,
  backButtonText,
  title,
  subtitle,
  onDownload,
  onComplete
}: CompletionComponentProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [allElements, setAllElements] = useState<PDFElement[]>([]);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use the form completion hook to get pre-filled data
  const { formData: preFilledData, loading: formDataLoading } = useFormCompletion();

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
    const loadData = async () => {
      try {
        // Load data from API service instead of sessionStorage
        const data = await ApiService.getPDFBuilderData();
        
        if (!data || !dataValidator(data)) {
          navigate('/');
          return;
        }
        
        const { pages: pagesData, elements } = dataExtractor(data);
        
        setPages(pagesData);
        
        // Filter elements and separate pre-filled from interactive
        const allElementsWithPage = elements.map(element => ({
          ...element,
          pageIndex: pagesData.findIndex(page => page.elements.some(el => el.id === element.id))
        }));
        
        const preFilledElements = allElementsWithPage.filter(element => element.preDefinedValueId);
        const interactiveElements = allElementsWithPage.filter(element => 
          !element.preDefinedValueId && element.type !== 'date'
        );
        
        setAllElements(interactiveElements);
        
        // Initialize form data
        const initialFormData: FormData = {};
        
        // Set pre-defined values using the actual backend data
        preFilledElements.forEach(element => {
          if (element.type === 'checkbox') {
            initialFormData[element.id] = true; // Default for pre-filled checkboxes
          } else {
            // Get the actual value from the pre-filled data based on the preDefinedValueId
            const preDefinedKey = element.preDefinedValueId as string;
            const actualValue = preFilledData[preDefinedKey];
            initialFormData[element.id] = actualValue || `Auto-filled: ${element.preDefinedLabel || element.placeholder}`;
          }
        });
        
        // Set defaults for interactive elements
        elements.forEach(element => {
          if (!element.preDefinedValueId) {
            if (element.type === 'checkbox') {
              initialFormData[element.id] = false;
            } else if (element.type === 'date') {
              // Auto-fill with current date
              initialFormData[element.id] = new Date().toLocaleDateString();
            } else {
              initialFormData[element.id] = '';
            }
          }
        });
        
        setFormData(initialFormData);
        
        // Focus first interactive element if mobile and exists
        if (interactiveElements.length > 0) {
          setActiveElement(interactiveElements[0].id);
          if (window.innerWidth < 768) {
            setTimeout(() => scrollToElement(interactiveElements[0].id), 300);
          }
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        navigate('/');
      }
    };

    // Only load data after the form completion data is ready
    if (!formDataLoading) {
      loadData();
    }
  }, [navigate, location.state, dataValidator, dataExtractor, preFilledData, formDataLoading]);

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(`pdf-element-${elementId}`);
    if (!element) return;

    // Find which page this element belongs to
    const elementData = allElements.find(el => el.id === elementId);
    if (!elementData) return;

    const pageIndex = pages.findIndex(page => 
      page.elements.some(el => el.id === elementId)
    );
    if (pageIndex === -1) return;

    // Get the page container
    const pageContainer = document.querySelector(`[data-page-index="${pageIndex}"]`);
    if (!pageContainer) return;

    const headerHeight = 80;
    const padding = 20;
    
    // Get the page container's position in the document
    const pageContainerTop = pageContainer.getBoundingClientRect().top + window.scrollY;
    
    // Get element's position within the page (from its style)
    const scale = isMobile ? 350 / 595 : 600 / 595;
    const elementTopInPage = elementData.y * scale;
    
    // Calculate total position: page position + element position within page
    const totalElementTop = pageContainerTop + elementTopInPage;
    
    // Calculate where to scroll
    const targetScrollTop = totalElementTop - headerHeight - padding;
    
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
      setTimeout(() => scrollToElement(element.id), 100);
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
    if (onComplete) {
      onComplete(formData);
    } else {
      toast.success("Form completed successfully!");
      console.log("Completed form data:", formData);
    }
  };

  const downloadPDF = async () => {
    try {
      await onDownload(pages, formData);
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download PDF: " + (error as Error).message);
    }
  };

  const getCompletionProgress = () => {
    try {
      // Since we now have pages and elements in state, use them directly
      const elements: PDFElement[] = [];
      pages.forEach(page => {
        elements.push(...page.elements);
      });
      
      const completedFields = elements.filter(element => {
        const value = formData[element.id];
        // Pre-filled elements are automatically considered complete
        if (element.preDefinedValueId) return true;
        return value !== "" && value !== false && value !== null && value !== undefined;
      }).length;
      
      return Math.round((completedFields / elements.length) * 100);
    } catch {
      return 0;
    }
  };

  if (pages.length === 0 || allElements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No form elements found</h2>
          <p className="text-muted-foreground mb-4">Please go back and add some form elements.</p>
          <Button onClick={() => navigate(backRoute)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backButtonText}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto p-6 pb-[50vh] max-w-4xl">
        {/* PDF with Interactive Elements */}
        <div>
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
                               {page.backgroundImage ? (
                                   // Blob URL for PDF
                                   <PDFRenderer
                                     key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                                     fileUrl={page.backgroundImage}
                                     width={600}
                                     height={842}
                                     pageNumber={pageIndex + 1}
                                     className="w-full"
                                   />
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
                                        isMobile={element.type !== 'date'} // Dates are not interactive
                                        showHighlight={activeElement === element.id}
                                        readOnly={!!element.preDefinedValueId} // Make pre-filled fields read-only
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
                            onClick={() => navigate(backRoute)} 
                            className="mt-4"
                            variant="outline"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {backButtonText}
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
                           style={{ minHeight: '495px' }}
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
                                  height={495}
                                  pageNumber={pageIndex + 1}
                                  className="w-full"
                                />
                             ) : page.backgroundImage instanceof File ? (
                                // File object (PDF or other file)
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}-${page.backgroundImage.name}`}
                                   fileUrl={page.backgroundImage}
                                   width={350}
                                   height={495}
                                   pageNumber={pageIndex + 1}
                                   className="w-full"
                                 />
                              ) : (
                                // Other string format
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}`}
                                   fileUrl={page.backgroundImage}
                                   width={350}
                                   height={495}
                                   pageNumber={pageIndex + 1}
                                   className="w-full"
                                 />
                              )
                            ) : (
                              <div className="w-full h-[495px] bg-white border border-gray-200 rounded flex items-center justify-center">
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
                                 readOnly={!!element.preDefinedValueId} // Make pre-filled fields read-only
                               />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[495px] text-muted-foreground">
                    <div className="text-center">
                      <p className="text-lg mb-2">No PDF uploaded</p>
                      <p className="text-sm">Please go back and upload a PDF file first.</p>
                      <Button 
                        onClick={() => navigate(backRoute)} 
                        className="mt-4"
                        variant="outline"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {backButtonText}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Field Navigation Stepper */}
        <div className="h-64" /> {/* Spacer for mobile navigation */}
        <MobileFieldNavigation
          elements={allElements}
          currentIndex={currentFieldIndex}
          onNavigate={handleNavigateToField}
          formData={formData}
          onFieldUpdate={handleInputChange}
          onDownload={downloadPDF}
        />
      </div>
    </div>
  );
};

export default CompletionComponent;
