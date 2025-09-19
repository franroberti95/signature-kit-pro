import { PDFDocument, rgb } from 'pdf-lib';
import { CompletionComponent } from "@/components/completion/CompletionComponent";
import { PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { ApiService } from "@/services/apiService";
import { toast } from "sonner";

interface FormData {
  [elementId: string]: string | boolean;
}

const PDFCompletionPage = () => {
  // Data validation function
  const validatePDFData = (data: any) => {
    return data && data.pages && Array.isArray(data.pages);
  };

  // Data extraction function
  const extractPDFData = (data: any) => {
    const pagesData = data.pages || [];
    
    // Collect all form elements from all pages
    const elements: PDFElement[] = [];
    pagesData.forEach((page: PDFPage) => {
      elements.push(...page.elements);
    });
    
    return {
      pages: pagesData,
      elements
    };
  };

  // Download handler for PDF completion
  const handlePDFDownload = async (pages: PDFPage[], formData: FormData) => {
    try {
      // Save the completion data using the API service
      await ApiService.saveFormCompletion(formData, `template_${Date.now()}`);
      
      const pdfDoc = await PDFDocument.create();
      
      // Check if we have an original PDF to work with
      const firstPage = pages[0];
      let originalPdfDoc: any = null;
      
      if (firstPage?.backgroundImage && typeof firstPage.backgroundImage === 'string' && firstPage.backgroundImage.startsWith('blob:')) {
        // Load the original PDF
        const response = await fetch(firstPage.backgroundImage);
        const existingPdfBytes = await response.arrayBuffer();
        originalPdfDoc = await PDFDocument.load(existingPdfBytes);
      }
      
      const pdfPages = originalPdfDoc ? originalPdfDoc.getPages() : [];
      
      // Process each page - same logic as before
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        let pdfPage;
        
        if (originalPdfDoc && pageIndex < pdfPages.length) {
          // Use existing page from original PDF
          const [copiedPage] = await pdfDoc.copyPages(originalPdfDoc, [pageIndex]);
          pdfPage = pdfDoc.addPage(copiedPage);
        } else {
          // Add new page if we have more pages than the original
          pdfPage = pdfDoc.addPage();
        }
        
        const { width, height } = pdfPage.getSize();
        
        // Add form fields as overlays
        for (const element of page.elements) {
          const value = formData[element.id];
          if (value && String(value) !== 'false') {
            // Calculate position using consistent scaling - match the interactive view exactly
            const scaleX = width / 595;  // A4 width in points
            const scaleY = height / 842; // A4 height in points
            const x = element.x * scaleX;
            // For text, position at the top of the element (not bottom) to match preview
            const y = height - (element.y * scaleY) - (element.type === 'text' || element.type === 'date' ? 12 : element.height * scaleY); // PDF coordinates are bottom-up
            
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
      console.error('Error downloading PDF:', error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  return (
    <CompletionComponent
      sessionStorageKey="pdf-builder-data" // Updated to match the new API service key
      dataValidator={validatePDFData}
      dataExtractor={extractPDFData}
      backRoute="/pdf-builder"
      backButtonText="Back to Builder"
      title="Complete PDF Form"
      subtitle="Click directly on the PDF to fill out fields"
      onDownload={handlePDFDownload}
      onComplete={(formData) => {
        toast.success("PDF completed successfully!");
        console.log("Completed form data:", formData);
      }}
    />
  );
};

export default PDFCompletionPage;