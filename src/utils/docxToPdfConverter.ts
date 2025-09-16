import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class DocxToPdfConverter {
  static async convertDocxToPdf(file: File): Promise<{ pdfBlob: Blob; fileName: string; pageImages: string[] }> {
    console.log('Starting DOCX to PDF conversion for file:', file.name, 'Size:', file.size);
    
    try {
      // Step 1: Convert DOCX to HTML using mammoth
      console.log('Converting DOCX to HTML...');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      console.log('HTML conversion complete. Length:', html.length);
      console.log('Extracted HTML content preview:', html.substring(0, 500));
      
      if (!html || html.trim().length === 0) {
        throw new Error('No content extracted from DOCX file');
      }

      // Step 2: Create a temporary DOM element to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-10000px';
      tempDiv.style.left = '-10000px';
      tempDiv.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.5';
      tempDiv.style.color = 'black';
      
      document.body.appendChild(tempDiv);
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const contentHeight = tempDiv.scrollHeight;
      console.log('Content rendered. Height:', contentHeight, 'px');

      // Step 3: Create PDF with proper page handling
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pageHeight = 1123; // A4 height in pixels
      const pageWidth = 794; // A4 width in pixels
      let yPosition = 0;
      let pageNumber = 0;
      const pageImages: string[] = []; // Store page images for display
      
      while (yPosition < contentHeight) {
        console.log(`Processing page ${pageNumber + 1}, yPosition: ${yPosition}`);
        
        // Create a clipped version for this page
        const pageDiv = tempDiv.cloneNode(true) as HTMLElement;
        pageDiv.style.position = 'absolute';
        pageDiv.style.top = `-${yPosition}px`;
        pageDiv.style.width = `${pageWidth}px`;
        pageDiv.style.height = `${pageHeight}px`;
        pageDiv.style.overflow = 'hidden';
        
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-20000px';
        wrapper.style.left = '-20000px';
        wrapper.style.width = `${pageWidth}px`;
        wrapper.style.height = `${pageHeight}px`;
        wrapper.style.backgroundColor = 'white';
        wrapper.appendChild(pageDiv);
        
        document.body.appendChild(wrapper);
        
        try {
          // Convert this page to canvas
          const canvas = await html2canvas(wrapper, {
            backgroundColor: 'white',
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            width: pageWidth,
            height: pageHeight,
            logging: false
          });
          
          console.log(`Page ${pageNumber + 1} canvas created:`, canvas.width, 'x', canvas.height);
          
          // Add page to PDF
          if (pageNumber > 0) {
            pdf.addPage();
          }
          
          const imgData = canvas.toDataURL('image/png', 0.95);
          pageImages.push(imgData); // Store for display
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
          
        } finally {
          document.body.removeChild(wrapper);
        }
        
        yPosition += pageHeight - 50;
        pageNumber++;
        
        if (pageNumber > 50) {
          console.warn('Document too large, stopping at 50 pages');
          break;
        }
      }
      
      console.log(`PDF creation complete. Total pages: ${pageNumber}`);

      // Clean up
      document.body.removeChild(tempDiv);

      // Generate PDF blob
      const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
      
      console.log('PDF blob created. Size:', pdfBlob.size);
      
      return {
        pdfBlob,
        fileName: file.name.replace(/\.docx$/i, '.pdf'),
        pageImages
      };

    } catch (error) {
      console.error('Error converting DOCX to PDF:', error);
      throw new Error(`Failed to convert DOCX to PDF: ${error.message}`);
    }
  }
}