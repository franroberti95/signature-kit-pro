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
import RichTextEditor from "@/components/pdf-builder/RichTextEditor";
import { ArrowLeft, FileCheck, Download, Eye, EyeOff, Edit } from "lucide-react";
import { COMMON_VARIABLES } from "@/constants/variables";
import { TRUE_A4_DIMENSIONS } from "@/constants/dimensions";

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
        // Load data from sessionStorage using the provided key
        const storedData = sessionStorage.getItem(sessionStorageKey);
        if (!storedData) {
          navigate('/');
          return;
        }
        
        const data = JSON.parse(storedData);
        
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
        
        // Check if element is pre-populated based on COMMON_VARIABLES or existing pre-definition
        const isElementPrePopulated = (element: PDFElement) => {
          if (element.preDefinedValueId) return true;
          
          // Check against COMMON_VARIABLES for pre-populated fields
          if (element.id && element.id.startsWith('rich-text-')) {
            const variableName = element.id.replace('rich-text-', '');
            const variable = COMMON_VARIABLES.find(v => v.name === variableName);
            return variable?.prePopulated === true;
          }
          
          return false;
        };
        
        const preFilledElements = allElementsWithPage.filter(isElementPrePopulated);
        const interactiveElements = allElementsWithPage.filter(element => 
          !isElementPrePopulated(element) && element.type !== 'date'
        );
        
        setAllElements(interactiveElements);
        
        // Initialize form data
        const initialFormData: FormData = {};
        
        // Set pre-defined values using the actual backend data
        preFilledElements.forEach(element => {
          if (element.type === 'checkbox') {
            initialFormData[element.id] = true; // Default for pre-filled checkboxes
          } else if (element.preDefinedValueId) {
            // Get the actual value from the pre-filled data based on the preDefinedValueId
            const preDefinedKey = element.preDefinedValueId as string;
            const actualValue = preFilledData[preDefinedKey];
            initialFormData[element.id] = actualValue || `Auto-filled: ${element.preDefinedLabel || element.placeholder}`;
          } else {
            // Handle COMMON_VARIABLES pre-populated fields
            if (element.id && element.id.startsWith('rich-text-')) {
              const variableName = element.id.replace('rich-text-', '');
              const variable = COMMON_VARIABLES.find(v => v.name === variableName);
              
              if (variable?.prePopulated) {
                if (variableName === 'patient_id') {
                  initialFormData[element.id] = `PT${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
                } else if (variableName === 'today_date') {
                  initialFormData[element.id] = new Date().toLocaleDateString();
                } else {
                  initialFormData[element.id] = `Auto-filled: ${variable.label}`;
                }
              }
            }
          }
        });
        
        // Set defaults for interactive elements (skip pre-populated ones)
        elements.forEach(element => {
          if (!isElementPrePopulated(element)) {
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
  }, [navigate, location.state, dataValidator, dataExtractor, preFilledData, formDataLoading, sessionStorageKey]);

  // Set up global click handler for inline rich text elements
  useEffect(() => {
    (window as any).openField = (variableName: string) => {
      const elementId = `rich-text-${variableName}`;
      const elementIndex = allElements.findIndex(el => el.id === elementId);
      if (elementIndex !== -1) {
        setCurrentFieldIndex(elementIndex);
        setActiveElement(elementId);
        // Scroll to bring the stepper into view
        setTimeout(() => {
          const stepperElement = document.querySelector('.mobile-field-navigation');
          if (stepperElement) {
            stepperElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    };

    return () => {
      delete (window as any).openField;
    };
  }, [allElements]);

  // Signature positioning adjustment disabled - was causing coordinate mismatch
  // useEffect(() => {
  //   if (allElements.length > 0) {
  //     const adjustSignaturePositions = () => {
  //       allElements.forEach((element) => {
  //         if (element.type === 'signature') {
  //           const signatureElement = document.getElementById(`pdf-element-${element.id}`);
  //           if (signatureElement) {
  //             const computedStyle = window.getComputedStyle(signatureElement);
  //             const styleTop = signatureElement.style.top ? parseInt(signatureElement.style.top) : 0;
  //             const computedTop = computedStyle.top ? parseInt(computedStyle.top) : 0;
  //             const actualTop = Math.max(styleTop, computedTop);
  //             
  //             // Only adjust if signature is way off-screen (very conservative)
  //             if (actualTop > 800) { // Only extreme cases
  //               const newTop = Math.max(element.y || 100, 100);
  //               signatureElement.style.top = `${newTop}px`;
  //               signatureElement.style.position = 'absolute';
  //               console.log(`📌 Repositioned off-screen signature: ${actualTop}px → ${newTop}px`);
  //             }
  //           }
  //         }
  //       });
  //     };

  //     // Single gentle adjustment
  //     setTimeout(adjustSignaturePositions, 200);
  //   }
  // }, [allElements]);

  const scrollToElement = (elementId: string) => {
    // Find target element
    let targetElement: HTMLElement | null = null;
    
    // Text variables are rendered with data-variable attribute
    if (elementId.startsWith('rich-text-')) {
      const variableName = elementId.replace('rich-text-', '');
      targetElement = document.querySelector(`[data-variable="${variableName}"]`) as HTMLElement;
    }
    
    // Try other selectors for signatures and fallback
    if (!targetElement) {
      const selectors = [
        `pdf-element-${elementId}`,
        `clickable-${elementId.replace('rich-text-', '')}`,
        elementId
      ];
      
      for (const selector of selectors) {
        targetElement = document.getElementById(selector);
        if (targetElement) break;
      }
    }

    if (!targetElement) return;

    // Calculate scroll position
    const elementRect = targetElement.getBoundingClientRect();
    const currentScrollY = window.scrollY || window.pageYOffset;
    const isSignature = !elementId.startsWith('rich-text-');
    const paddingTop = 20;
    
    let elementTopAbsolute = elementRect.top + currentScrollY;
    
    // For signatures, use stored Y coordinate relative to page container
    if (isSignature) {
      const pageContainer = targetElement.closest('[data-page-index]');
      if (pageContainer) {
        const containerRect = (pageContainer as HTMLElement).getBoundingClientRect();
        const containerTopAbsolute = containerRect.top + currentScrollY;
        const elementData = allElements.find(el => el.id === elementId);
        
        if (elementData?.y !== undefined) {
          elementTopAbsolute = containerTopAbsolute + elementData.y;
        }
      }
    }
    
    // Subtract signature height so top is visible, not bottom
    const signatureHeight = isSignature ? (elementRect.height || TRUE_A4_DIMENSIONS.SIGNATURE_HEIGHT) : 0;
    const targetScroll = Math.max(0, elementTopAbsolute - paddingTop - signatureHeight);
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  const handleInputChange = (elementId: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }));
    
    // Update inline display if rich text content (only for text/date fields, not signatures)
    if (elementId.startsWith('rich-text-')) {
      const variableName = elementId.replace('rich-text-', '');
      const clickableElement = document.getElementById(`clickable-${variableName}`);
      if (clickableElement && typeof value === 'string' && value.trim()) {
        clickableElement.textContent = value;
        clickableElement.style.background = '#e8f5e8';
        clickableElement.style.borderBottomColor = '#28a745';
      }
    }
  };

  const handleNavigateToField = (index: number) => {
    if (index >= 0 && index < allElements.length) {
      const element = allElements[index];
      
      setCurrentFieldIndex(index);
      setActiveElement(element.id);
      
      // Wait for DOM to update, then scroll to element
      setTimeout(() => {
        scrollToElement(element.id);
      }, 100);
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
                  <div className="pdf-renderer-container relative border rounded-lg bg-gray-50 overflow-x-auto overflow-y-hidden">
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
                               className={`relative bg-white shadow-lg rounded-lg mx-auto ${page.backgroundImage === 'rich-text-content' ? '' : 'overflow-hidden'}`}
                               style={{ width: `${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px`, height: page.backgroundImage === 'rich-text-content' ? 'auto' : `${TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}px` }}
                             >
                               {(() => {
                                 const bgImage = page.backgroundImage;
                                 const richTextContent = (page as any).richTextContent || '';
                                 return page.backgroundImage ? (
                                   page.backgroundImage == 'rich-text-content' ? (
                                     // Rich text content rendered with RichTextEditor - read-only preview
                                     <RichTextEditor
                                       key={`preview-${pageIndex}-${richTextContent.substring(0, 50)}`}
                                       value={richTextContent}
                                       readOnly={true}
                                       onChange={() => {}}
                                       className="w-full"
                                       style={{ width: '100%' }}
                                     />
                                 ) : (
                                   // Blob URL for PDF
                                   <PDFRenderer
                                     key={`pdf-page-${pageIndex}-${page.backgroundImage}`}
                                     fileUrl={page.backgroundImage}
                                     width={TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}
                                     height={TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}
                                     pageNumber={pageIndex + 1}
                                     className=""
                                   />
                                 )
                               ) : (
                                  <div className="bg-white border border-gray-200 rounded flex items-center justify-center" style={{ width: `${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px`, height: `${TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}px` }}>
                                    <div className="text-center text-muted-foreground">
                                      <p>Page {pageIndex + 1}</p>
                                      <p className="text-sm">No background image</p>
                                    </div>
                                  </div>
                                )
                               })()}
                               {/* Interactive Elements Overlay - Show signatures for rich-text-content, skip text/date fields */}
                              {page.elements.filter(element => 
                                page.backgroundImage !== 'rich-text-content' || element.type === 'signature'
                              ).map((element) => {
                                // SIMPLIFIED: Use centralized dimensions
                                const CONTENT_WIDTH = TRUE_A4_DIMENSIONS.CONTENT_WIDTH;
                                const CONTENT_HEIGHT = TRUE_A4_DIMENSIONS.CONTENT_HEIGHT;
                                const TOOLBAR_HEIGHT = TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT;
                                
                                const adjustedElement = element.type === 'signature' ? {
                                  ...element,
                                  // No horizontal adjustment needed - preview now matches builder dimensions exactly
                                  x: element.x, // Direct coordinate mapping - no centering offset
                                  y: element.y - TOOLBAR_HEIGHT // Only remove toolbar offset
                                } : element;
                                
                                return (
                                <div
                                  key={element.id}
                                  id={`pdf-element-${element.id}`}
                                >
                                     <InteractivePDFElement
                                       element={adjustedElement}
                                       scale={1.0} // No scaling needed - preview container is same size as builder
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
                                );
                              })}
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
              <div className="pdf-renderer-container relative bg-gray-50 overflow-x-auto overflow-y-hidden">
                {pages.length > 0 ? (
                  <div className="space-y-8 p-2">
                    {pages.map((page, pageIndex) => (
                      <div key={page.id} className="relative" data-page-index={pageIndex}>
                         <div 
                           className="relative bg-white shadow-lg rounded overflow-hidden mx-auto" 
                           style={{ width: `${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px`, height: `${TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}px` }}
                         >
                           {page.backgroundImage ? (
                              page.backgroundImage === 'rich-text-content' ? (
                                // Rich text content rendered with ReactQuill (read-only, no toolbar)
                                <div 
                                  className="bg-white overflow-hidden rich-text-preview"
                                  style={{ 
                                    width: `${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px`,  // Match builder: 794px
                                    height: `${TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}px`, // Match builder: 1123px
                                  }}
                                >
                                  <RichTextEditor
                                    key={`preview-mobile-${pageIndex}-${(page as any).richTextContent?.substring(0, 50)}`}
                                    value={(page as any).richTextContent || ''}
                                    readOnly={true}
                                    onChange={() => {}} // Required prop even in read-only mode
                                    className="w-full"
                                    style={{ width: '100%' }}
                                  />
                                </div>
                              ) : typeof page.backgroundImage === 'string' && page.backgroundImage.startsWith('data:image/') ? (
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
                                  width={TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}
                                  height={TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}
                                  pageNumber={pageIndex + 1}
                                  className=""
                                />
                             ) : page.backgroundImage instanceof File ? (
                                // File object (PDF or other file)
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}-${page.backgroundImage.name}`}
                                   fileUrl={page.backgroundImage}
                                   width={TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}
                                   height={TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}
                                   pageNumber={pageIndex + 1}
                                   className=""
                                 />
                              ) : (
                                // Other string format
                                 <PDFRenderer
                                   key={`pdf-page-${pageIndex}`}
                                   fileUrl={page.backgroundImage}
                                   width={TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}
                                   height={TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}
                                   pageNumber={pageIndex + 1}
                                   className=""
                                 />
                              )
                            ) : (
                              <div className="bg-white border border-gray-200 rounded flex items-center justify-center" style={{ width: `${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px`, height: `${TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}px` }}>
                                <div className="text-center text-muted-foreground">
                                  <p>Page {pageIndex + 1}</p>
                                  <p className="text-sm">No background image</p>
                                </div>
                              </div>
                            )}
                          {/* Interactive Elements Overlay - Show signatures for rich-text-content, skip text/date fields */}
                          {page.elements.filter(element => 
                            page.backgroundImage !== 'rich-text-content' || element.type === 'signature'
                          ).map((element) => {
                            // SIMPLIFIED: Use centralized dimensions (same as desktop)
                            const CONTENT_WIDTH = TRUE_A4_DIMENSIONS.CONTENT_WIDTH;
                            const CONTENT_HEIGHT = TRUE_A4_DIMENSIONS.CONTENT_HEIGHT;
                            const TOOLBAR_HEIGHT = TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT;
                            
                            const adjustedElement = element.type === 'signature' ? {
                              ...element,
                              // No horizontal adjustment needed - preview now matches builder dimensions exactly
                              x: element.x, // Direct coordinate mapping - no centering offset
                              y: element.y - TOOLBAR_HEIGHT // Only remove toolbar offset
                            } : element;
                            
                            return (
                            <div
                              key={element.id}
                              id={`pdf-element-${element.id}`}
                            >
                               <InteractivePDFElement
                                 element={adjustedElement}
                                 scale={1.0} // No scaling needed - mobile container is same size as builder
                                 value={formData[element.id] || ''}
                                 onUpdate={(value) => handleInputChange(element.id, value)}
                                 isActive={activeElement === element.id}
                                 onActivate={() => handleElementClick(element.id)}
                                 hideOverlay={!showOverlay}
                                 isMobile={true}
                                 readOnly={!!element.preDefinedValueId} // Make pre-filled fields read-only
                               />
                            </div>
                            );
                          })}
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
        <div className="mobile-field-navigation">
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
    </div>
  );
};

export default CompletionComponent;
