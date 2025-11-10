import { useState } from "react";
import { CompletionComponent } from "@/components/completion/CompletionComponent";
import { PDFElement, PDFPage, PDFFormat } from "@/components/pdf-builder/PDFBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/pdf-builder/SignatureCanvas";
import { toast } from "sonner";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { TRUE_A4_DIMENSIONS, CoordinateHelpers } from "@/constants/dimensions";

interface FormData {
  [elementId: string]: string | boolean;
}

interface VariableType {
  name: string;
  type: 'text' | 'textarea' | 'signature' | 'date';
}

interface RichTextPDFPage extends PDFPage {
  richTextContent?: string;
  richTextVariables?: VariableType[];
  originalRichTextContent?: string;
}

interface ExtendedPDFElement extends PDFElement {
  stepperType?: string;
  stepperOrder?: number;
  properties?: { [key: string]: unknown };
  pageIndex?: number; // Track which page this element belongs to (from builder)
}

interface RichTextData {
  pages: RichTextPDFPage[];
  selectedFormat?: string;
}

const RichTextCompletionPage = () => {
  // Note: Builder and preview now use the same coordinate system (64px padding)
  // No toolbar height adjustment needed
  
  // Convert rich text data to PDF-like format for the completion component
  const validateRichTextData = (data: unknown): data is RichTextData => {
    return data !== null &&
           typeof data === 'object' && 
           'pages' in data && 
           Array.isArray((data as RichTextData).pages) && 
           (data as RichTextData).pages.length > 0 && 
           (data as RichTextData).pages[0].richTextContent !== undefined;
  };


  const extractRichTextData = (data: RichTextData) => {
    // Process ALL pages from the builder, not just the first one
    const allBuilderPages = data.pages || [];
    
    // Get variables from the first page (they're shared across all pages)
    const sourcePage = allBuilderPages[0];
    const richTextVariables = sourcePage?.richTextVariables || [];
    
    // Collect all elements from all builder pages, preserving their pageIndex
    const allElements: ExtendedPDFElement[] = [];
    allBuilderPages.forEach((page, pageIndex) => {
      if (page.elements) {
        page.elements.forEach(element => {
          // Preserve the pageIndex from the builder, or use the current page index
          const elementWithPageIndex: ExtendedPDFElement = {
            ...element,
            pageIndex: (element as any).pageIndex !== undefined ? (element as any).pageIndex : pageIndex
          };
          allElements.push(elementWithPageIndex);
        });
      }
    });
    
    console.log(`📄 Collected ${allElements.length} elements from ${allBuilderPages.length} pages`);
    allElements.forEach((el, i) => {
      console.log(`  Element ${i + 1} (${el.id}): pageIndex=${el.pageIndex}, type=${el.type}, pos=(${el.x}, ${el.y})`);
    });
    
    console.log(`📄 Processing ${allBuilderPages.length} pages from builder`);
    allBuilderPages.forEach((page, index) => {
      console.log(`  Page ${index + 1}: ${page.richTextContent?.length || 0} chars, ${page.elements?.length || 0} elements`);
    });
    
    // Variables are processed per page in the contentPages loop below
    
    // Elements are already collected from all builder pages above
    
    console.log(`🎯 Builder → Completion: Signature coordinates from builder:`, 
      allElements
        .filter(e => e.type === 'signature')
        .map(e => `${e.id}: x=${e.x}, y=${e.y}, w=${e.width}, h=${e.height}`)
    );
    
    // Use the pages directly from the builder - each page has its own content
    // Process each builder page's content
    const contentPages: string[] = [];
    allBuilderPages.forEach((builderPage, index) => {
      // PRESERVE original HTML content with all formatting for each page
      const pageContent = builderPage.richTextContent || "";
      
      // Convert styled variables back to {{variable}} format for processing
      const quillEmbedRegex = /<span[^>]*class=["'][^"']*variable-embed[^"']*["'][^>]*data-variable=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/g;
      const processedContent = pageContent.replace(quillEmbedRegex, (match, variableName) => {
        return `{{${variableName}}}`;
      });
      
      contentPages.push(processedContent);
      console.log(`📄 Builder page ${index + 1}: ${pageContent.length} chars (original), ${processedContent.length} chars (processed)`);
    });
    
    const numPages = allBuilderPages.length;
    const containerHeight = TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT;
    
    // Extract variables from content (now in {{variable}} format)
    // Check all pages for variable usage
    const usedVariables: { name: string; type: string; position: number }[] = [];
    
    richTextVariables.forEach((variable: VariableType) => {
      const varName = typeof variable === 'object' ? variable.name : variable;
      const varType = typeof variable === 'object' ? variable.type : 'text';
      
      // Check if this variable is used in any page's content
      let foundPosition = -1;
      let cumulativePosition = 0;
      
      for (let i = 0; i < contentPages.length; i++) {
        const position = contentPages[i].indexOf(`{{${varName}}}`);
        if (position !== -1) {
          foundPosition = cumulativePosition + position;
          break;
        }
        cumulativePosition += contentPages[i].length;
      }
      
      if (foundPosition !== -1) {
        usedVariables.push({ name: varName, type: varType, position: foundPosition });
      }
    });
    
    // Sort variables by their position in the document, but prioritize text/date fields first, then signatures
    usedVariables.sort((a, b) => {
      // First priority: text/date fields before signatures
      if (a.type !== 'signature' && b.type === 'signature') return -1;
      if (a.type === 'signature' && b.type !== 'signature') return 1;
      
      // Second priority: document position within the same type
      return a.position - b.position;
    });
    
    // Debug: Variables ordered by document position
    console.log('Stepper order - Text fields first, then signatures:', 
      usedVariables.map(v => `${v.name} (${v.type})`).join(' → ')
    );
    
    // Create positioned PDF elements for used variables (one per variable)
    // Note: Content now uses dynamic replacement in CompletionComponent instead of static placeholders
    
    // Create form elements for the stepper (signatures need positioning, text/date don't)
    const variableElements = usedVariables.map((variable, varIndex) => {
      if (variable.type === 'signature') {
        // Position based on actual HTML structure before the signature
        const variablePosition = variable.position;
        // Find which page this variable is on and get the content before it
        let cumulativeLength = 0;
        let pageIndex = 0;
        let textBeforeSignature = '';
        for (let i = 0; i < contentPages.length; i++) {
          if (cumulativeLength + contentPages[i].length > variablePosition) {
            pageIndex = i;
            const positionInPage = variablePosition - cumulativeLength;
            textBeforeSignature = contentPages[i].substring(0, positionInPage);
            break;
          }
          cumulativeLength += contentPages[i].length;
        }
        
        // Count actual HTML elements that create visual lines
        const paragraphs = (textBeforeSignature.match(/<p[^>]*>/g) || []).length;
        const lineBreaks = (textBeforeSignature.match(/<br\s*\/?>/g) || []).length;
        const divs = (textBeforeSignature.match(/<div[^>]*>/g) || []).length;
        
        // Fallback: if minimal HTML structure, estimate from plain text
        let estimatedLines = paragraphs + lineBreaks + divs;
        
        if (estimatedLines === 0 && textBeforeSignature.length > 0) {
          // Strip HTML and count approximate lines based on text length
          const plainText = textBeforeSignature.replace(/<[^>]*>/g, '').trim();
          if (plainText.length > 0) {
            // Rough estimate: 80 characters per line in rich text editor
            estimatedLines = Math.ceil(plainText.length / 80);
          }
        }
        
        // Ensure we have at least some positioning if there's content before
        estimatedLines = Math.max(0, estimatedLines);
        
        // Match actual completion screen dimensions
        const isMobile = window.innerWidth < 768;
        const containerHeight = isMobile ? 495 : 842;
        const padding = isMobile ? 48 : 64; // p-12 = 48px, p-16 = 64px
        const containerWidth = 764;
        
        // Font: 12pt, lineHeight: 1.6 → roughly 19-20px per line
        const lineHeight = 20;
        
        const x = padding + 10; // Slightly indented from left
        const y = padding + (estimatedLines * lineHeight) + 10; // Direct line-based positioning
        
        console.log(`📍 Signature ${variable.name}: ${isMobile ? 'Mobile' : 'Desktop'} p=${paragraphs}, br=${lineBreaks}, div=${divs} → ${estimatedLines} lines → y=${Math.round(y)}px`);
        
        return {
          id: `rich-text-${variable.name}`,
          type: 'signature' as const,
          x: Math.min(x, containerWidth - 250), // Don't exceed container width
          y: Math.min(y, containerHeight - 100), // Don't exceed container height
          width: 200,
          height: 50,
          placeholder: variable.name.replace(/_/g, ' '),
          required: true,
          preDefinedLabel: variable.name.replace(/_/g, ' '),
          stepperOrder: variable.position, // Add position for sorting
          stepperType: variable.type // Add type for sorting
        };
      } else {
        // Text/date fields use inline approach, minimal positioning needed
      return {
          id: `rich-text-${variable.name}`,
          type: variable.type === 'date' ? 'date' as const : 'text' as const,
          x: 0, // Not used for inline approach
          y: 0, // Not used for inline approach  
          width: 200,
          height: 40,
          placeholder: variable.name.replace(/_/g, ' '),
          required: true,
          preDefinedLabel: variable.name.replace(/_/g, ' '),
          stepperOrder: variable.position, // Add position for sorting
          stepperType: variable.type // Add type for sorting
        };
      }
    });
    
    // Combine ALL elements (interactive signature boxes + text variables) and sort properly
    let allFormElements = [...allElements, ...variableElements];
    
    // Remove duplicates based on ID
    const uniqueElements = new Map();
    allFormElements.forEach(element => {
      uniqueElements.set(element.id, element);
    });
    allFormElements = Array.from(uniqueElements.values());
    
    // Sort ALL elements by type priority (text/date first, then signatures) and position
    allFormElements.sort((a, b) => {
      const aType = a.stepperType || (a.type === 'signature' ? 'signature' : 'text');
      const bType = b.stepperType || (b.type === 'signature' ? 'signature' : 'text');
      const aOrder = a.stepperOrder || 0;
      const bOrder = b.stepperOrder || 0;
      
      // First priority: text/date fields before signatures
      if (aType !== 'signature' && bType === 'signature') return -1;
      if (aType === 'signature' && bType !== 'signature') return 1;
      
      // Second priority: document position within the same type
      return aOrder - bOrder;
    });
    
    // Note: Removed automatic signature spacing that was overriding user-positioned coordinates
    
    console.log('Final stepper order:', allFormElements.map(e => ({ 
      id: e.id, 
      type: e.type, 
      x: e.x, 
      y: e.y,
      stepperOrder: e.stepperOrder 
    })));
    
    // DISTRIBUTE SIGNATURES ACROSS PAGES using FIXED A4 dimensions
    const distributeElementsAcrossPages = () => {
      // Use TRUE A4 dimensions for consistent coordinate calculations
      const containerWidth = TRUE_A4_DIMENSIONS.CONTAINER_WIDTH;
      const containerHeight = TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT;
      const containerPadding = TRUE_A4_DIMENSIONS.PADDING;
      const contentHeight = TRUE_A4_DIMENSIONS.CONTENT_HEIGHT;
      
      console.log(`📏 Fixed A4 dimensions: containerSize=${containerWidth}×${containerHeight}, padding=${containerPadding}, contentHeight=${contentHeight}`);
      
      // Create array of page element collections
      const pageElements: ExtendedPDFElement[][] = Array(numPages).fill(null).map(() => []);
      
      allFormElements.forEach(element => {
        if (element.type === 'signature') {
          // Use the pageIndex from the builder if available, otherwise calculate from Y coordinate
          let targetPageIndex = element.pageIndex;
          
          if (targetPageIndex === undefined || targetPageIndex < 0 || targetPageIndex >= numPages) {
            // Fallback: calculate from Y coordinate if pageIndex is not available
            const builderY = element.y || 0;
            const adjustedY = builderY;
            targetPageIndex = Math.floor(adjustedY / contentHeight);
            console.log(`⚠️ Signature ${element.id} has no pageIndex, calculating from Y=${builderY} → page ${targetPageIndex + 1}`);
          }
          
          const clampedPageIndex = Math.max(0, Math.min(targetPageIndex, numPages - 1));
          
          // Y coordinate is already relative to the page it belongs to (from builder)
          // No need to adjust for page offset since coordinates are page-relative
          const adjustedElement = {
            ...element,
            y: element.y || 0
          };
          
          pageElements[clampedPageIndex].push(adjustedElement);
          console.log(`📍 Signature ${element.id}: pageIndex=${element.pageIndex} → page ${clampedPageIndex + 1}, y=${element.y}`);
        } else {
          // Text/date elements go on the first page (they use inline approach)
          pageElements[0].push(element);
        }
      });
      
      return pageElements;
    };
    
    const pageElementArrays = distributeElementsAcrossPages();
    
    // CREATE MULTIPLE PAGES with distributed content and elements
    // Use ORIGINAL HTML content directly from each builder page - preserve all formatting!
    console.log(`📄 Creating ${allBuilderPages.length} pages from builder`);
    
    // Use the original HTML content from each builder page directly
    const virtualPages: RichTextPDFPage[] = allBuilderPages.map((builderPage, pageIndex) => {
      const originalPageContent = builderPage.richTextContent || "";
      const processedPageContent = contentPages[pageIndex] || "";
      
      return {
        id: builderPage.id || `rich-text-page-${pageIndex + 1}`,
        format: (data.selectedFormat as PDFFormat) || 'A4',
        elements: pageElementArrays[pageIndex] || [],
        backgroundImage: 'rich-text-content', // Special identifier for rich text
        richTextContent: originalPageContent, // Use original HTML from builder page (for display)
        richTextVariables,
        originalRichTextContent: pageIndex === 0 ? processedPageContent : '', // Keep processed version (with {{variable}}) only on first page for PDF generation
      };
    });
    
    console.log(`📄 Created ${virtualPages.length} pages with content split`);
    virtualPages.forEach((page, i) => {
      console.log(`  Page ${i + 1}: ${page.elements.length} elements`);
    });

    return {
      pages: virtualPages,
      elements: allFormElements // Return all elements for stepper
    };
  };


  // Rich text specific download handler
  const handleRichTextDownload = async (pages: PDFPage[], formData: FormData) => {
    try {
    
    // DEBUG: Log all formData keys to see what's actually stored
    console.log('🔍 DEBUG: All formData keys:', Object.keys(formData));
    console.log('🔍 DEBUG: FormData entries:', Object.entries(formData).map(([key, value]) => ({
      key,
      valueType: typeof value,
      valueLength: typeof value === 'string' ? value.length : 'N/A',
      isSignature: typeof value === 'string' && value.startsWith('data:image/')
    })));
    
    // Get content from the first page
    // NOTE: richTextContent has original HTML (for display), originalRichTextContent has processed version (for PDF)
    const firstPage = pages[0] as RichTextPDFPage;
    let richTextContent = firstPage.originalRichTextContent || "";
    
    // If originalRichTextContent is empty or contains HTML tags, we need to process richTextContent
    // Check if it's HTML (has tags) vs processed (has {{variable}})
    const hasHtmlTags = /<[^>]+>/.test(richTextContent);
    const hasVariables = /\{\{[^}]+\}\}/.test(richTextContent);
    
    if (!richTextContent || (hasHtmlTags && !hasVariables)) {
      // Need to process richTextContent to convert embeds to {{variable}} format
      const sourceContent = firstPage.richTextContent || "";
      const quillEmbedRegex = /<span[^>]*class=["'][^"']*variable-embed[^"']*["'][^>]*data-variable=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/g;
      richTextContent = sourceContent.replace(quillEmbedRegex, (match, variableName) => {
        return `{{${variableName}}}`;
      });
      console.log(`📄 PDF: Processed HTML content to {{variable}} format`);
    }
    
    const richTextVariables = firstPage.richTextVariables || [];
    
    // Collect all signature elements from all pages and restore absolute coordinates
    const allSignatureElements: PDFElement[] = [];
        pages.forEach((page, pageIndex) => {
          const richTextPage = page as RichTextPDFPage;
          richTextPage.elements.forEach(element => {
            if (element.type === 'signature') {
              // Restore absolute Y position for PDF generation using TRUE A4 calculations
              const containerHeight = TRUE_A4_DIMENSIONS.CONTAINER_HEIGHT;
              const containerPadding = TRUE_A4_DIMENSIONS.PADDING;
              const contentHeight = TRUE_A4_DIMENSIONS.CONTENT_HEIGHT;
              
              const absoluteElement = {
                ...element,
                y: element.y + (pageIndex * contentHeight) // Restore absolute position
              };
              allSignatureElements.push(absoluteElement);
              console.log(`📄 PDF: Signature ${element.id} - page ${pageIndex + 1}, relativeY=${element.y} → absoluteY=${absoluteElement.y} (standard coordinates)`);
            }
          });
        });
    
    console.log(`📄 PDF Generation: Processing ${richTextContent.length} chars with ${allSignatureElements.length} signatures across ${pages.length} pages`);
    console.log(`📄 PDF: Content preview (first 200 chars):`, richTextContent.substring(0, 200));
    
    // Create PDF with EXACT A4 dimensions matching screen coordinates
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297] // Exact A4 dimensions in mm
    });

    // Set up PDF text properties to MATCH the builder exactly
    pdf.setFont('helvetica', 'normal'); // Closest to Arial
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    const pageWidth = pdf.internal.pageSize.getWidth(); // Should be 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // Should be 297mm

    // SIMPLIFIED: Use centralized dimensions and calculations
    const screenContentWidth = TRUE_A4_DIMENSIONS.CONTENT_WIDTH;
    const screenContentHeight = TRUE_A4_DIMENSIONS.CONTENT_HEIGHT;
    const pdfContentWidth = TRUE_A4_DIMENSIONS.PDF_CONTENT_WIDTH_MM;
    const pdfContentHeight = TRUE_A4_DIMENSIONS.PDF_CONTENT_HEIGHT_MM;
    const marginX = TRUE_A4_DIMENSIONS.PDF_MARGIN_X_MM;
    const marginY = TRUE_A4_DIMENSIONS.PDF_MARGIN_Y_MM;
    
    // MATCH BUILDER LINE HEIGHT: 12pt font × 1.6 line-height = ~19.2px = ~6.8mm at 72 DPI
    const lineHeight = 6.8; // Increased from 6mm to match builder's 1.6 line-height
    let yPosition = marginY;
    
    // Both text and signatures use absolute positioning with same baseline
    
    console.log(`📄 PDF Page setup: ${pageWidth}×${pageHeight}mm`);
    console.log(`📄 Screen content: ${screenContentWidth}×${screenContentHeight}px (ReactQuill effective area)`);
    console.log(`📄 PDF content: ${pdfContentWidth.toFixed(1)}×${pdfContentHeight.toFixed(1)}mm (EXACT pixel conversion at 96 DPI)`);
    console.log(`📄 PDF margins: X=${marginX.toFixed(1)}mm, Y=${marginY.toFixed(1)}mm (centered on A4)`);
    console.log(`📏 Line height: ${lineHeight}mm (matches builder's 1.6 line-height)`);
    console.log(`🎯 TRUE A4 MATCH: ${screenContentWidth}px → ${pdfContentWidth.toFixed(1)}mm, ${screenContentHeight}px → ${pdfContentHeight.toFixed(1)}mm (96 DPI conversion)`);
    console.log(`🔍 DIMENSIONS COMPARISON:`);
    console.log(`   📐 Calculated: marginX=${marginX.toFixed(1)}mm, marginY=${marginY.toFixed(1)}mm, contentW=${pdfContentWidth.toFixed(1)}mm, contentH=${pdfContentHeight.toFixed(1)}mm`);
    console.log(`   🏗️ Constants: marginX=${TRUE_A4_DIMENSIONS.PDF_MARGIN_X_MM.toFixed(1)}mm, marginY=${TRUE_A4_DIMENSIONS.PDF_MARGIN_Y_MM.toFixed(1)}mm, contentW=${TRUE_A4_DIMENSIONS.PDF_CONTENT_WIDTH_MM.toFixed(1)}mm, contentH=${TRUE_A4_DIMENSIONS.PDF_CONTENT_HEIGHT_MM.toFixed(1)}mm`);
    
    // Check if we have content to work with
    if (!richTextContent || richTextContent.trim() === '') {
      throw new Error('No rich text content found. Please go back and add some content to your document.');
    }
    
    // Process content and variables for PDF rendering
    // Use original HTML content (from richTextContent) to preserve formatting
    // Get the original HTML content from the first page
    const originalHtmlContent = firstPage.richTextContent || "";
    let finalContent = originalHtmlContent; // Start with original HTML to preserve formatting
    const signatureImages: { name: string; imageData: string; width: number; height: number; x?: number; y?: number }[] = [];
    const embeddedImages: { src: string; width: number; height: number; position: number }[] = [];
    
    // Get all form data entries that match our rich-text pattern
    const richTextEntries = Object.entries(formData).filter(([key]) => 
      key.startsWith('rich-text-')
    );
    
    // Create values mapping from form data
    const variableValues: { [varName: string]: string } = {};
    richTextEntries.forEach(([key, value]) => {
      // Extract variable name from key like "rich-text-patient_name"
      const varName = key.replace('rich-text-', '');
      if (value && typeof value === 'string') {
        variableValues[varName] = value;
        // Track variable values (signatures logged separately)
        if (!value.startsWith('data:image/')) {
          console.log(`Text variable: ${varName} = ${value}`);
        }
      }
    });
    
    console.log(`📄 PDF: About to process ${allSignatureElements.length} signature elements:`, 
      allSignatureElements.map(e => `${e.id}: pos(${e.x}, ${e.y}) size(${e.width}×${e.height})`)
    );
    
    // Check for signature data from interactive elements (signature boxes) across ALL pages
    allSignatureElements.forEach(element => {
      if (element.type === 'signature') {
        // Check form data for this element's signature data
        // Try both possible key formats: element.id and element-{element.id}
        const directKey = element.id;
        const prefixedKey = `element-${element.id}`;
        
        // DEBUG: Show what we're looking for
        console.log(`🔍 Looking for signature: ${element.id}`);
        console.log(`   Trying keys: "${directKey}", "${prefixedKey}"`);
        console.log(`   Available keys in formData:`, Object.keys(formData).filter(k => k.includes(element.id) || element.id.includes(k.replace('element-', ''))));
        
        const signatureData = formData[directKey] || formData[prefixedKey];
        const usedKey = formData[directKey] ? directKey : prefixedKey;
        
        // Debug signature data lookup
        if (!signatureData) {
          console.log(`❌ No signature data found for ${element.id} (tried keys: ${directKey}, ${prefixedKey})`);
          console.log(`   Available formData keys:`, Object.keys(formData));
        } else {
          console.log(`✅ Found signature data for ${element.id} using key: ${usedKey}`);
        }
        
        if (signatureData && typeof signatureData === 'string' && signatureData.startsWith('data:image/')) {
          // This is an interactive signature box with data
          const elementName = String((element as ExtendedPDFElement).properties?.fieldName || `signature_${element.id}`);
          signatureImages.push({
            name: elementName,
            imageData: signatureData,
            width: 60, // mm
            height: 20, // mm
            x: element.x,
            y: element.y
          });
          
          console.log(`✅ Added interactive signature: ${elementName} at position (${element.x}, ${element.y}) using key: ${usedKey}`);
        } else if (signatureData) {
          console.log(`⚠️ Found data for ${element.id} but it's not a signature image:`, typeof signatureData, typeof signatureData === 'string' ? signatureData.substring(0, 50) : signatureData);
        } else {
          console.log(`❌ No signature data found for element ${element.id}`);
        }
      }
    });
    
    // FIRST: Convert HTML embeds to {{variable}} format, then replace with values
    // Pattern for Quill embed with nested spans
    const quillEmbedRegex = /<span[^>]*class=["'][^"']*variable-embed[^"']*["'][^>]*data-variable=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/g;
    finalContent = finalContent.replace(quillEmbedRegex, (match, variableName) => {
      return `{{${variableName}}}`;
    });
    
    // Replace variables in content and collect signatures (content now has {{variable}} format)
    richTextVariables.forEach((variable: VariableType) => {
      const varName = typeof variable === 'object' ? variable.name : variable;
      const varType = typeof variable === 'object' ? variable.type : 'text';
      const value = variableValues[varName] || '';
      
      const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
      
      if (varType === 'signature' && typeof value === 'string' && value.startsWith('data:image/')) {
        // For signatures, store image info and replace with named placeholder text
        console.log('Found signature for', varName, 'with data length:', value.length);
        signatureImages.push({
          name: varName,
          imageData: value,
          width: 60, // mm
          height: 20  // mm
        });
        finalContent = finalContent.replace(regex, `[SIGNATURE:${varName}]`);
      } else if (varType === 'date' && value) {
        const dateValue = new Date(value as string).toLocaleDateString();
        finalContent = finalContent.replace(regex, dateValue);
      } else {
        // Clean the value to remove any BOM or problematic characters
        const cleanValue = (value as string)
          .replace(/^\uFEFF/, '') // Remove UTF-8 BOM
          .replace(/^[\uFEFF\u200B-\u200D\u2060]+/, '') // Remove zero-width characters
          .replace(/[\uFEFF\u200B-\u200D\u2060]+$/, '') // Remove trailing zero-width characters
          .replace(/[\uFEFF\u200B-\u200D\u2060]+/g, ' '); // Replace zero-width characters with space
        finalContent = finalContent.replace(regex, cleanValue);
      }
    });
    
    console.log(`Signatures collected: ${signatureImages.length} (${signatureImages.filter(s => s.x !== undefined).length} positioned, ${signatureImages.filter(s => !s.x && !s.y).length} inline)`);
    
    // Extract images from HTML content before converting to plain text
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    let match;
    let imageCount = 0;
    while ((match = imgRegex.exec(finalContent)) !== null) {
      const imgSrc = match[1];
      const imgTag = match[0];
      const position = match.index;
      
      // Extract width/height if specified, otherwise use defaults
      const widthMatch = imgTag.match(/width="?(\d+)"?/i);
      const heightMatch = imgTag.match(/height="?(\d+)"?/i);
      
      let imgWidth = widthMatch ? parseInt(widthMatch[1]) : 200;
      let imgHeight = heightMatch ? parseInt(heightMatch[1]) : 150;
      
      // Convert pixels to points (1px ≈ 0.75pt) and scale down for PDF
      imgWidth = (imgWidth * 0.75) / 2; // Scale down to fit better
      imgHeight = (imgHeight * 0.75) / 2;
      
      embeddedImages.push({
        src: imgSrc,
        width: Math.min(imgWidth, 300), // Max width 300pt
        height: Math.min(imgHeight, 200), // Max height 200pt  
        position
      });
      
      // Replace image with placeholder text that we can find later
      finalContent = finalContent.replace(imgTag, `[IMAGE_${imageCount}]`);
      imageCount++;
    }
    
    console.log(`Found ${embeddedImages.length} images in content`);
    
    // Parse HTML and render with formatting preserved
    // Helper function to parse HTML and extract text segments with formatting
    const parseHTMLToSegments = (html: string) => {
      const segments: Array<{
        text?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        fontSize?: number;
        color?: string;
        align?: 'left' | 'center' | 'right' | 'justify';
        isParagraph?: boolean;
        isSignature?: string;
        isImage?: number;
      }> = [];
      
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      const processNode = (node: Node, currentStyle: {
        bold: boolean;
        italic: boolean;
        underline: boolean;
        fontSize: number;
        color: string;
        align: 'left' | 'center' | 'right' | 'justify';
      }) => {
        if (node.nodeType === Node.TEXT_NODE) {
          let text = node.textContent || '';
          // Remove BOM and other problematic characters
          text = text
            .replace(/^\uFEFF/, '') // Remove UTF-8 BOM
            .replace(/^[\uFEFF\u200B-\u200D\u2060]+/, '') // Remove zero-width characters
            .replace(/[\uFEFF\u200B-\u200D\u2060]+$/, '') // Remove trailing zero-width characters
            .replace(/[\uFEFF\u200B-\u200D\u2060]+/g, ' '); // Replace zero-width characters with space
          
          if (text.trim()) {
            segments.push({
              text: text,
              bold: currentStyle.bold,
              italic: currentStyle.italic,
              underline: currentStyle.underline,
              fontSize: currentStyle.fontSize,
              color: currentStyle.color,
              align: currentStyle.align
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          
          // Handle signatures
          if (element.textContent?.includes('[SIGNATURE:')) {
            const match = element.textContent.match(/\[SIGNATURE:([^\]]+)\]/);
            if (match) {
              segments.push({ isSignature: match[1] });
              const before = element.textContent.split(match[0])[0];
              const after = element.textContent.split(match[0])[1];
              if (before) segments.push({ text: before, ...currentStyle });
              if (after) segments.push({ text: after, ...currentStyle });
            }
            return;
          }
          
          // Handle images
          if (tagName === 'img') {
            const src = element.getAttribute('src') || '';
            const imageIndex = embeddedImages.findIndex(img => img.src === src);
            if (imageIndex >= 0) {
              segments.push({ isImage: imageIndex });
            }
            return;
          }
          
          // Update style based on tag
          const newStyle = { ...currentStyle };
          
          if (tagName === 'strong' || tagName === 'b') newStyle.bold = true;
          if (tagName === 'em' || tagName === 'i') newStyle.italic = true;
          if (tagName === 'u') newStyle.underline = true;
          
          // Handle headers
          if (tagName.match(/^h[1-6]$/)) {
            const level = parseInt(tagName[1]);
            newStyle.fontSize = 12 + (7 - level) * 2; // h1=18, h2=16, h3=14, etc.
            newStyle.bold = true;
          }
          
          // Handle alignment
          const align = element.getAttribute('class')?.match(/ql-align-(\w+)/)?.[1];
          if (align === 'center') newStyle.align = 'center';
          else if (align === 'right') newStyle.align = 'right';
          else if (align === 'justify') newStyle.align = 'justify';
          
          // Handle color
          const style = element.getAttribute('style');
          if (style) {
            const colorMatch = style.match(/color:\s*([^;]+)/);
            if (colorMatch) newStyle.color = colorMatch[1].trim();
          }
          
          // Handle paragraphs
          if (tagName === 'p') {
            if (segments.length > 0 && !segments[segments.length - 1].isParagraph) {
              segments.push({ isParagraph: true });
            }
          }
          
          // Process children
          Array.from(element.childNodes).forEach(child => processNode(child, newStyle));
          
          // Add paragraph break after closing tag
          if (tagName === 'p' && segments.length > 0) {
            segments.push({ isParagraph: true });
          }
        }
      };
      
      Array.from(tempDiv.childNodes).forEach(node => {
        processNode(node, {
          bold: false,
          italic: false,
          underline: false,
          fontSize: 12,
          color: '#000000',
          align: 'left'
        });
      });
      
      return segments;
    };
    
    const segments = parseHTMLToSegments(finalContent);
    console.log(`📝 Parsed ${segments.length} text segments with formatting`);
    
    // Render segments to PDF with formatting
    let currentX = marginX;
    let currentY = yPosition;
    
    segments.forEach((segment, index) => {
      // Check if we need a new page
      if (currentY + lineHeight > pageHeight - marginY) {
        pdf.addPage();
        currentY = marginY;
        currentX = marginX;
      }
      
      // Handle paragraph breaks
      if (segment.isParagraph) {
        currentY += lineHeight;
        currentX = marginX;
        return;
      }
      
      // Handle signatures
      if (segment.isSignature) {
        const signature = signatureImages.find(sig => sig.name === segment.isSignature);
        if (signature) {
          try {
            pdf.addImage(signature.imageData, 'PNG', currentX, currentY - 5, signature.width, signature.height);
            currentX += signature.width;
            console.log(`✅ Embedded signature: ${segment.isSignature}`);
          } catch (error) {
            console.warn('Failed to add signature image:', error);
            pdf.text(`[${segment.isSignature.toUpperCase()} ERROR]`, currentX, currentY);
            currentX += pdf.getTextWidth(`[${segment.isSignature.toUpperCase()} ERROR]`);
          }
        }
        return;
      }
      
      // Handle images
      if (segment.isImage !== undefined) {
        const imageData = embeddedImages[segment.isImage];
        if (imageData) {
          try {
            let imageFormat = 'PNG';
            if (imageData.src.includes('data:image/jpeg') || imageData.src.includes('.jpg') || imageData.src.includes('.jpeg')) {
              imageFormat = 'JPEG';
            }
            pdf.addImage(imageData.src, imageFormat, currentX, currentY - 5, imageData.width, imageData.height);
            currentX += imageData.width;
            currentY += Math.max(imageData.height, lineHeight);
            console.log(`✅ Embedded image ${segment.isImage}`);
          } catch (error) {
            console.warn(`Failed to add image ${segment.isImage}:`, error);
          }
        }
        return;
      }
      
      // Handle text with formatting
      if (segment.text) {
        // Clean the text one more time to ensure no BOM or problematic characters
        const cleanText = segment.text
          .replace(/^\uFEFF/, '') // Remove UTF-8 BOM
          .replace(/^[\uFEFF\u200B-\u200D\u2060]+/, '') // Remove zero-width characters
          .replace(/[\uFEFF\u200B-\u200D\u2060]+$/, '') // Remove trailing zero-width characters
          .replace(/[\uFEFF\u200B-\u200D\u2060]+/g, ' '); // Replace zero-width characters with space
        
        if (!cleanText.trim()) return; // Skip empty segments
        
        // Apply formatting
        const fontStyle = segment.bold && segment.italic ? 'bolditalic' :
                         segment.bold ? 'bold' :
                         segment.italic ? 'italic' : 'normal';
        pdf.setFont('helvetica', fontStyle);
        pdf.setFontSize(segment.fontSize || 12);
        
        // Set text color
        if (segment.color && segment.color !== '#000000') {
          const rgb = segment.color.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            pdf.setTextColor(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
          } else if (segment.color.startsWith('#')) {
            const hex = segment.color.substring(1);
            pdf.setTextColor(`#${hex}`);
          }
        } else {
          pdf.setTextColor(0, 0, 0);
        }
        
        // Split text to fit page width
        const lines = pdf.splitTextToSize(cleanText, pdfContentWidth - (currentX - marginX));
        
        lines.forEach((line: string, lineIndex: number) => {
          if (lineIndex > 0) {
            currentY += lineHeight;
            currentX = marginX;
            // Check for new page
            if (currentY + lineHeight > pageHeight - marginY) {
              pdf.addPage();
              currentY = marginY;
            }
          }
          
          // Apply alignment
          let xPos = currentX;
          if (segment.align === 'center') {
            xPos = marginX + (pdfContentWidth - pdf.getTextWidth(line)) / 2;
          } else if (segment.align === 'right') {
            xPos = marginX + pdfContentWidth - pdf.getTextWidth(line);
          } else if (segment.align === 'justify' && lineIndex < lines.length - 1) {
            // Simple justify: add spaces between words
            const words = line.split(' ');
            if (words.length > 1) {
              const totalWidth = pdfContentWidth - (currentX - marginX);
              const textWidth = pdf.getTextWidth(line);
              const spaceWidth = (totalWidth - textWidth) / (words.length - 1);
              // For now, just use left align (full justify is complex)
              xPos = currentX;
            }
          }
          
          pdf.text(line, xPos, currentY);
          currentX = xPos + pdf.getTextWidth(line);
        });
      }
    });
    
    yPosition = currentY + lineHeight;
    console.log(`📝 TEXT POSITIONING: ${yPosition.toFixed(1)}mm height in ${pdfContentHeight}mm content area`);

    // Add positioned signatures from interactive elements
    signatureImages.forEach(signature => {
      if (signature.x !== undefined && signature.y !== undefined) {
        try {
          // DEBUG: Let's see what coordinates we're working with
          console.log(`🔍 DEBUGGING SIGNATURE COORDINATES for ${signature.name}:`);
          console.log(`   📱 Raw builder coordinates: x=${signature.x}, y=${signature.y}px`);
          
          // SIMPLIFIED: Use centralized coordinate conversion
          const { pdfX, pdfY } = CoordinateHelpers.builderToPDF(signature.x, signature.y);
          const previewCoords = CoordinateHelpers.builderToPreview(signature.x, signature.y);
          
          // DETAILED DEBUG: Show coordinate transformation step by step
          const contentX = signature.x - TRUE_A4_DIMENSIONS.PADDING;
          const contentY = signature.y - TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT - TRUE_A4_DIMENSIONS.PADDING;
          const contentXPercent = contentX / TRUE_A4_DIMENSIONS.CONTENT_WIDTH;
          const contentYPercent = contentY / TRUE_A4_DIMENSIONS.CONTENT_HEIGHT;
          
          console.log(`   🔄 COORDINATE TRANSFORMATION:`);
          console.log(`   📱 Builder container coords: (${signature.x}, ${signature.y})px`);
          console.log(`   📦 Content area coords: (${contentX}, ${contentY})px (after removing padding+toolbar)`);
          console.log(`   📊 Content area percentages: ${(contentXPercent*100).toFixed(1)}% X, ${(contentYPercent*100).toFixed(1)}% Y`);
          console.log(`   📄 Final PDF coords: (${pdfX.toFixed(1)}, ${pdfY.toFixed(1)})mm`);
          
          console.log(`   🖥️ Preview coordinates (toolbar only): x=${previewCoords.x}, y=${previewCoords.y}px`);
          
          console.log(`   🎯 CONVERSION SUMMARY: Builder(${signature.x},${signature.y}) → Preview(${previewCoords.x},${previewCoords.y}) → PDF(${pdfX.toFixed(1)},${pdfY.toFixed(1)})`);
          
          // SIMPLIFIED: Calculate PDF signature size proportionally
          const BUILDER_SIGNATURE_WIDTH = 240; // Fixed width in builder
          const BUILDER_SIGNATURE_HEIGHT = 80;  // Fixed height in builder
          
          // Calculate proportional PDF size based on TRUE A4 content areas
          let pdfWidth = BUILDER_SIGNATURE_WIDTH * pdfContentWidth / screenContentWidth;
          let pdfHeight = BUILDER_SIGNATURE_HEIGHT * pdfContentHeight / screenContentHeight;
          
          // Cap PDF signature size to prevent overflow
          const MAX_PDF_WIDTH = 60;  // Maximum 60mm wide (~2.4 inches)
          const MAX_PDF_HEIGHT = 25; // Maximum 25mm tall (~1 inch)
          
          if (pdfWidth > MAX_PDF_WIDTH) {
            const scale = MAX_PDF_WIDTH / pdfWidth;
            pdfWidth = MAX_PDF_WIDTH;
            pdfHeight = pdfHeight * scale; // Scale height proportionally
          }
          
          if (pdfHeight > MAX_PDF_HEIGHT) {
            const scale = MAX_PDF_HEIGHT / pdfHeight;
            pdfHeight = MAX_PDF_HEIGHT;
            pdfWidth = pdfWidth * scale; // Scale width proportionally
          }
          
          console.log(`📏 SIGNATURE POSITIONING DEBUG: ${signature.name}`);
          console.log(`   📱 Screen coordinate: (${signature.x}, ${signature.y})px`);
          console.log(`   📄 PDF coordinate: (${pdfX.toFixed(1)}, ${pdfY.toFixed(1)})mm [PERCENTAGE-BASED]`);
          console.log(`   📏 Signature size: ${pdfWidth.toFixed(1)}×${pdfHeight.toFixed(1)}mm in PDF`);
          
          pdf.addImage(signature.imageData, 'PNG', pdfX, pdfY, pdfWidth, pdfHeight);
          console.log(`✅ Added signature to PDF at (${pdfX.toFixed(1)}, ${pdfY.toFixed(1)})mm using centralized coordinate conversion`);
          console.log(`🎯 FINAL CHECK: PDF addImage called with X=${pdfX.toFixed(1)}mm, Y=${pdfY.toFixed(1)}mm (from CoordinateHelpers.builderToPDF)`);
        } catch (error) {
          console.warn(`❌ Failed positioned signature: ${signature.name}`, error);
        }
      }
    });

    // Download
    pdf.save(`completed-document-${Date.now()}.pdf`);
    toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  return (
    <CompletionComponent
      sessionStorageKey="richTextBuilderData"
      dataValidator={validateRichTextData}
      dataExtractor={extractRichTextData}
      backRoute="/rich-text-builder"
      backButtonText="Back to Builder"
      title="Complete Document"
      subtitle="Click directly on the document to fill out fields"
      onDownload={handleRichTextDownload}
      onComplete={(formData) => {
        toast.success("Document completed successfully!");
        console.log("Completed rich text data:", formData);
      }}
    />
  );
};

export default RichTextCompletionPage;