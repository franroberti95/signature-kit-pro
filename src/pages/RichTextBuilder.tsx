import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  FileText, 
  X, 
  PenTool,
  Type,
  Calendar,
  ArrowLeft,
  Plus
} from "lucide-react";
import RichTextEditor, { RichTextEditorRef } from "@/components/pdf-builder/RichTextEditor";
import { ApiService } from "@/services/apiService";
import { useIsMobile } from "@/hooks/use-mobile";

type PDFFormat = "A4" | "A5" | "Letter";

import { VariableType, COMMON_VARIABLES } from '@/constants/variables';
import { TRUE_A4_DIMENSIONS, PAGE_LIMITS } from '@/constants/dimensions';

interface InteractiveElement {
  id: string;
  type: 'signature';
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number; // Track which page this element belongs to
}

interface PageData {
  id: string;
  content: string;
  elements: InteractiveElement[];
}

// PAGE_LIMITS now imported from centralized constants


// Interactive Signature Box Component
const InteractiveSignatureBox = ({ element, onUpdate, onDelete }: {
  element: InteractiveElement;
  onUpdate: (element: InteractiveElement) => void;
  onDelete: (id: string) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Get container bounds to convert to container-relative coordinates  
        const container = (e.target as HTMLElement).closest(`[style*="width: ${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px"]`) as HTMLElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const newX = e.clientX - rect.left - dragStart.x;
          const newY = e.clientY - rect.top - dragStart.y;
          
          onUpdate({
            ...element,
            x: newX,
            y: newY,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, element, onUpdate]);

  return (
    <div
      className="absolute border-2 border-dashed border-purple-400 bg-purple-50 bg-opacity-90 pointer-events-auto cursor-move group hover:border-purple-500 transition-colors"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        minWidth: '120px',
        minHeight: '40px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.signature-content')) {
          setIsDragging(true);
          
          // Calculate drag start relative to container, not viewport
          const container = (e.target as HTMLElement).closest(`[style*="width: ${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px"]`) as HTMLElement;
          if (container) {
            const rect = container.getBoundingClientRect();
            setDragStart({
              x: (e.clientX - rect.left) - element.x,
              y: (e.clientY - rect.top) - element.y,
            });
          }
          
          e.preventDefault();
        }
      }}
    >
      <div className="signature-content p-2 text-center text-purple-700 text-sm font-medium flex flex-col items-center justify-center h-full">
        <PenTool className="h-4 w-4 mb-1" />
        <span>{element.label}</span>
        {/* Debug info */}
        <span className="text-xs text-purple-500 font-mono mt-1">
          240×80px (fixed)
        </span>
        <span className="text-xs text-purple-500 font-mono">
          @{element.x},{element.y}
        </span>
  </div>
  
      {/* Delete button */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
        onClick={() => onDelete(element.id)}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const RichTextBuilderPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Multi-page state management
  const [pages, setPages] = useState<PageData[]>([
    { id: `page-${Date.now()}`, content: "", elements: [] }
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const editorRefs = useRef<(RichTextEditorRef | null)[]>([]);
  
  // SIMPLIFIED: Use centralized TRUE A4 dimensions
  const containerWidth = `${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px`;
  const containerHeight = `${TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT}px`;

  // Function to estimate content size for pagination
  const estimateContentSize = (htmlContent: string) => {
    // Strip HTML tags and get text content
    const textContent = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // SIMPLIFIED: Use centralized page limits
    const avgCharsPerLine = PAGE_LIMITS.avgCharsPerLine;
    const estimatedLines = Math.ceil(textContent.length / avgCharsPerLine);
    
    // Account for rich text formatting (headers, spacing, etc.)
    const formattingMultiplier = htmlContent.includes('<h') ? 1.5 : 
                               htmlContent.includes('<p>') ? 1.2 : 1.0;
    
    const adjustedLines = Math.ceil(estimatedLines * formattingMultiplier);
    
    return {
      characters: textContent.length,
      estimatedLines: adjustedLines,
      percentageFull: Math.min((adjustedLines / PAGE_LIMITS.maxLines) * 100, 100),
      isNearLimit: adjustedLines >= (PAGE_LIMITS.maxLines * PAGE_LIMITS.warningThreshold),
      isOverLimit: adjustedLines >= PAGE_LIMITS.maxLines
    };
  };

  // Get content stats for current page
  const getCurrentPageStats = () => {
    const currentPage = pages[currentPageIndex];
    return currentPage ? estimateContentSize(currentPage.content || '') : { 
      characters: 0, estimatedLines: 0, percentageFull: 0, isNearLimit: false, isOverLimit: false 
    };
  };

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('richTextBuilderData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.pages && Array.isArray(data.pages)) {
          // Multi-page format
          setPages(data.pages);
        } else {
          // Legacy single-page format - convert to multi-page
          const legacyPage: PageData = {
            id: `page-${Date.now()}`,
            content: data.content || "",
            elements: (data.interactiveElements || []).map((el: InteractiveElement) => ({ ...el, pageIndex: 0 }))
          };
          setPages([legacyPage]);
        }
      } catch (error) {
        console.error('Error parsing stored rich text builder data:', error);
        // Initialize with defaults on error
        setPages([{ id: `page-${Date.now()}`, content: "", elements: [] }]);
      }
    } else {
      // No data found, initialize with defaults  
      setPages([{ id: `page-${Date.now()}`, content: "", elements: [] }]);
    }

    // DEBUG: Comprehensive coordinate system analysis
    setTimeout(() => {
      const container = document.querySelector(`[style*="width: ${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px"]`);
      const toolbar = document.querySelector('.ql-toolbar');
      const editor = document.querySelector('.ql-editor');
      
      if (container && toolbar && editor) {
        const containerRect = container.getBoundingClientRect();
        const toolbarRect = toolbar.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        
        console.log(`📏 COORDINATE SYSTEM ANALYSIS:`);
        console.log(`   📦 Container: ${containerRect.height}px tall, starts at ${containerRect.top}`);
        console.log(`   🔧 Toolbar: ${toolbarRect.height}px tall, starts at ${toolbarRect.top}`);
        console.log(`   📝 Editor: ${editorRect.height}px tall, starts at ${editorRect.top}`);
        console.log(`   📐 CSS constant: ${TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT}px`);
        
        // Calculate the actual offset from container top to editor content start
        const actualOffset = editorRect.top - containerRect.top;
        console.log(`   ✨ ACTUAL TOTAL OFFSET: ${actualOffset}px (container top → editor content)`);
        console.log(`   ${actualOffset === TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT ? '✅' : '❌'} Match with constant: ${actualOffset === TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT}`);
        
        if (actualOffset !== TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT) {
          console.log(`   🔄 SUGGESTED FIX: Update TOOLBAR_HEIGHT to ${actualOffset}px`);
        }
      }
    }, 1000); // Wait for ReactQuill to fully render
  }, [navigate]);

  // Function to clear editor state and reset formatting for current page
  const clearEditorState = (pageIndex: number) => {
    const editorRef = editorRefs.current[pageIndex];
    if (editorRef) {
      const editor = editorRef.getEditor();
      if (editor) {
        // Clear all formatting
        editor.removeFormat(0, editor.getLength());
        // Reset selection
        editor.setSelection(editor.getLength(), 0);
      }
    }
  };

  // Add new page
  const addNewPage = () => {
    const newPage: PageData = {
      id: `page-${Date.now()}`,
      content: "",
      elements: []
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length); // Switch to new page
    updateStoredData([...pages, newPage]);
  };

  // Delete page
  const deletePage = (pageIndex: number) => {
    if (pages.length <= 1) return; // Don't delete if only one page
    
    const updatedPages = pages.filter((_, index) => index !== pageIndex);
    setPages(updatedPages);
    
    // Adjust current page index if needed
    if (currentPageIndex >= updatedPages.length) {
      setCurrentPageIndex(updatedPages.length - 1);
    }
    
    updateStoredData(updatedPages);
  };

  const updateStoredData = (updatedPages?: PageData[]) => {
    const pagesToStore = updatedPages || pages;
    sessionStorage.setItem('richTextBuilderData', JSON.stringify({
      selectedFormat: "A4", // Always use A4 format
      pages: pagesToStore,
      variables: COMMON_VARIABLES,
      isRichTextDocument: true
    }));
  };

  const handleContentChange = (pageIndex: number, newContent: string) => {
    // Check content limits
    const stats = estimateContentSize(newContent);
    
    // Log content stats for debugging
    if (stats.isOverLimit) {
      console.log(`⚠️ Page ${pageIndex + 1} content exceeds limit: ${stats.estimatedLines}/${PAGE_LIMITS.maxLines} lines`);
    }
    
    // Update the page content
    const updatedPages = pages.map((page, index) => 
      index === pageIndex ? { ...page, content: newContent } : page
    );
    setPages(updatedPages);
    updateStoredData(updatedPages);
    
    // Optional: Auto-create new page if current page is significantly over limit
    // Uncomment below if you want automatic page creation
    /*
    if (stats.estimatedLines > PAGE_LIMITS.maxLines * 1.5 && pageIndex === pages.length - 1) {
      console.log('📄 Auto-creating new page due to content overflow');
      addNewPage();
    }
    */
  };

  const handleVariableClick = (variableName: string) => {
    // Insert variable at current cursor position in current page
    const editorRef = editorRefs.current[currentPageIndex];
    if (editorRef) {
      editorRef.insertVariable(variableName);
    }
  };


  const handleContinue = async () => {
    // Check if any page has content or elements
    const hasContent = pages.some(page => page.content.trim() || page.elements.length > 0);
    if (!hasContent) {
      toast("Please add some content or signature fields to your document first.");
      return;
    }

    // Convert all pages to PDF builder format
    // Sort elements by Y coordinate (top to bottom) before storing - order is preserved in array
    const pdfPages = pages.map((page, pageIndex) => {
      // Sort elements on this page by Y coordinate (top to bottom)
      const sortedElements = [...page.elements].sort((a, b) => {
        return (a.y || 0) - (b.y || 0);
      });
      
      // Convert interactive signature elements to PDF builder format
      // Array order is preserved, so stepper will use this order
      const pdfElements = sortedElements.map((element, elementIndex) => {
        return {
          id: element.id,
          type: element.type,
          x: element.x,
          y: element.y, // Y coordinate is already page-relative
          width: element.width,
          height: element.height,
          properties: {
            placeholder: element.label,
            required: true,
            fieldName: element.name
          },
          // Add pre-defined label for better UX
          preDefinedLabel: element.label,
          placeholder: element.label,
          required: true,
          // Preserve pageIndex so completion screen knows which page this element belongs to
          pageIndex: element.pageIndex !== undefined ? element.pageIndex : pageIndex
        };
      });

      return {
        id: page.id,
        format: "A4" as PDFFormat, // Always use A4 format
        elements: pdfElements,
        richTextContent: page.content,
        richTextVariables: COMMON_VARIABLES
      };
    });
    
    // Store in the format expected by RichTextCompletionPage
    const completionData = {
      pages: pdfPages,
      selectedFormat: "A4", // Always use A4 format
      isRichTextDocument: true
    };
    
    // Store using ApiService for consistency with completion component
    await ApiService.savePDFBuilderData(pdfPages, "A4");
    
    // Store in sessionStorage with the key that RichTextCompletionPage expects
    sessionStorage.setItem('richTextBuilderData', JSON.stringify(completionData));
    
    const totalElements = pdfPages.reduce((sum, page) => sum + page.elements.length, 0);
    toast(`Document ready! ${pages.length} pages created with ${totalElements} signature fields.`);
    navigate('/rich-text-completion');
  };


  // Fixed signature dimensions - standard size for all signatures
  const SIGNATURE_WIDTH = 240; // 240px wide (larger for signatures)
  const SIGNATURE_HEIGHT = 80;  // 80px tall (taller for signatures)

  const addInteractiveElement = (signatureData: { type: string; name: string; label?: string }, x: number, y: number, pageIndex: number) => {
    const newElement: InteractiveElement = {
      id: `signature-${Date.now()}`,
      type: 'signature',
      name: signatureData.name,
      label: signatureData.label || signatureData.name,
      x: x - (SIGNATURE_WIDTH / 2), // Center the element
      y: y - (SIGNATURE_HEIGHT / 2),
      width: SIGNATURE_WIDTH,  // Fixed dimensions
      height: SIGNATURE_HEIGHT, // Fixed dimensions
      pageIndex,
    };
    
    console.log(`🎯 Builder: Added signature at (${newElement.x}, ${newElement.y}) size ${newElement.width}×${newElement.height} on page ${pageIndex + 1}`);
    
    // DEBUG: Show coordinate context for alignment debugging
    const container = document.querySelector(`[style*="width: ${TRUE_A4_DIMENSIONS.CONTAINER_WIDTH}px"]`);
    const toolbar = document.querySelector('.ql-toolbar');
    if (container && toolbar) {
      const containerRect = container.getBoundingClientRect();
      const toolbarRect = toolbar.getBoundingClientRect();
      const actualOffset = toolbarRect.height;
      console.log(`🔍 BUILDER COORDINATE CONTEXT:`);
      console.log(`   📦 Signature stored at: (${newElement.x}, ${newElement.y})px relative to container`);
      console.log(`   🔧 Measured toolbar height: ${actualOffset}px`);
      console.log(`   📐 CSS constant (corrected): ${TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT}px`);
      console.log(`   🎯 Expected preview Y: ${newElement.y - TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT}px (toolbar height now correctly measured)`);
    }
    
    const updatedPages = pages.map((page, index) => 
      index === pageIndex 
        ? { ...page, elements: [...page.elements, newElement] }
        : page
    );
    setPages(updatedPages);
    updateStoredData(updatedPages);
    toast(`Added ${newElement.label} signature box to page ${pageIndex + 1}`);
  };

  const updateInteractiveElement = (updatedElement: InteractiveElement) => {
    const updatedPages = pages.map((page, index) => 
      index === updatedElement.pageIndex
        ? { ...page, elements: page.elements.map(el => el.id === updatedElement.id ? updatedElement : el) }
        : page
    );
    setPages(updatedPages);
    updateStoredData(updatedPages);
  };

  const deleteInteractiveElement = (elementId: string) => {
    const updatedPages = pages.map(page => ({
      ...page,
      elements: page.elements.filter(el => el.id !== elementId)
    }));
    setPages(updatedPages);
    updateStoredData(updatedPages);
    toast("Signature box deleted");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Editor
            </h1>
            <p className="text-sm text-muted-foreground">
                Create professional documents with variables • A4 format
            </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => clearEditorState(currentPageIndex)}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              Clear Format
            </Button>
          <Button 
            onClick={handleContinue}
              className="bg-green-600 hover:bg-green-700 gap-2"
          >
              Continue to Completion
          </Button>
          </div>
        </div>
      </header>

              
      {/* Main Content Area */}
      <div className="flex flex-1 bg-gray-50">
        {/* Sticky Sidebar with draggable elements */}
        <div className="w-64 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Drag & Drop Elements</h3>
            
            {/* Signature Boxes */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signatures</h4>
              {COMMON_VARIABLES.filter(v => v.type === 'signature').map((variable) => (
                  <div 
                    key={variable.name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                      type: 'signature',
                      name: variable.name,
                      label: variable.label
                    }));
                  }}
                  className="p-3 border-2 border-dashed border-purple-300 bg-purple-50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-purple-700">
                    <PenTool className="h-4 w-4" />
                    <span className="text-sm font-medium">{variable.label || variable.name}</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Drag into document</p>
                </div>
              ))}
            </div>

            {/* Text Fields */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Text Fields</h4>
              {COMMON_VARIABLES.filter(v => v.type === 'text').map((variable) => (
                <div
                  key={variable.name}
                      draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', `{{${variable.name}}}`);
                  }}
                  onClick={() => handleVariableClick(variable.name)}
                  className="p-2 border border-blue-300 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                  title="Click to insert at cursor position or drag to any location"
                >
                  <div className="flex items-center gap-2 text-blue-700">
                    <Type className="h-3 w-3" />
                    <span className="text-xs font-medium">{variable.label || variable.name}</span>
                    {variable.prePopulated && (
                      <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">Auto</span>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {variable.prePopulated ? 'Auto-filled • Click or drag to insert' : 'Click or drag to insert'}
                  </p>
                  </div>
                ))}
              </div>

            {/* Date Fields */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dates</h4>
              {COMMON_VARIABLES.filter(v => v.type === 'date').map((variable) => (
                <div
                  key={variable.name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', `{{${variable.name}}}`);
                  }}
                  onClick={() => handleVariableClick(variable.name)}
                  className="p-2 border border-orange-300 bg-orange-50 rounded cursor-pointer hover:bg-orange-100 transition-colors"
                  title="Click to insert at cursor position or drag to any location"
                >
                  <div className="flex items-center gap-2 text-orange-700">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs font-medium">{variable.label || variable.name}</span>
                    {variable.prePopulated && (
                      <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">Auto</span>
                    )}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    {variable.prePopulated ? 'Auto-filled • Click or drag to insert' : 'Click or drag to insert'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Page Editor Container */}
        <div className="flex-1 flex justify-center p-6 overflow-y-auto">
          <div className="flex flex-col gap-6">
            
            {/* Pages */}
            {pages.map((page, pageIndex) => (
              <div key={page.id} className="relative">
                {/* Page Header with Content Stats */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Page {pageIndex + 1}
                    </span>
                    
                    {/* Content Capacity Indicator */}
                    {(() => {
                      const stats = estimateContentSize(page.content || '');
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                              title={`${stats.estimatedLines}/${PAGE_LIMITS.maxLines} lines (${stats.percentageFull.toFixed(0)}% full)`}
                            >
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  stats.isOverLimit ? 'bg-red-500' : 
                                  stats.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(stats.percentageFull, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs ${
                              stats.isOverLimit ? 'text-red-600 font-medium' : 
                              stats.isNearLimit ? 'text-yellow-600' : 'text-gray-500'
                            }`}>
                              {stats.estimatedLines}/{PAGE_LIMITS.maxLines}
                            </span>
                          </div>
                          
                          {stats.isOverLimit && (
                            <Badge variant="destructive" className="text-xs">
                              Page Full
                            </Badge>
                          )}
                          {stats.isNearLimit && !stats.isOverLimit && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              Near Limit
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
            </div>
            
                  {pages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePage(pageIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
              </div>
              
                {/* Document Container - TRUE A4 794px width */}
                <div 
                  className="bg-white rounded-lg overflow-hidden relative shadow-md"
                  style={{ width: containerWidth, height: containerHeight }}
                  onDrop={(e) => {
                    const data = e.dataTransfer.getData('text/plain');
                    try {
                      const signatureData = JSON.parse(data);
                      if (signatureData.type === 'signature') {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const dropX = e.clientX - rect.left;
                        const dropY = e.clientY - rect.top;
                        
                        addInteractiveElement(signatureData, dropX, dropY, pageIndex);
                      }
                    } catch (error) {
                      // Not signature data, let editor handle it normally
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                >
                  {/* Rich Text Editor Layer - No internal scrolling */}
                  <div className="absolute inset-0 z-10 overflow-hidden">
                    <RichTextEditor
                      ref={(ref) => {
                        if (editorRefs.current) {
                          editorRefs.current[pageIndex] = ref;
                        }
                      }}
                      value={page.content}
                      onChange={(newContent) => handleContentChange(pageIndex, newContent)}
                      variables={COMMON_VARIABLES.map(v => v.name)}
                      className="h-full w-full"
                      style={{ 
                        height: containerHeight, 
                        minHeight: containerHeight,
                        maxHeight: containerHeight,
                        overflow: 'hidden'
                      }}
                    />
                  </div>
                  
                  {/* Interactive Elements Overlay - only for signature boxes */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {page.elements.map((element) => (
                      <InteractiveSignatureBox
                        key={element.id}
                        element={element}
                        onUpdate={(updatedElement) => updateInteractiveElement(updatedElement)}
                        onDelete={(elementId) => deleteInteractiveElement(elementId)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Page Button */}
            <div className="flex flex-col items-center mt-4 space-y-2">
              <Button
                onClick={addNewPage}
                variant="outline"
                className="w-full max-w-[595px] h-12 border-dashed border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Page
              </Button>
              <div className="text-center text-xs text-muted-foreground max-w-[595px]">
                Each page fits approximately {PAGE_LIMITS.maxLines} lines of content (adjusted to match PDF output). The progress bar shows current page capacity.
              </div>
            </div>
            
          </div>
        </div>
      </div>

    </div>
  );
};

export default RichTextBuilderPage;