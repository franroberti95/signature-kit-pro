import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class DocxToPdfConverter {
  static async convertDocxToPdf(file: File): Promise<{ pdfBlob: Blob; fileName: string }> {
    try {
      // Step 1: Convert DOCX to HTML using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

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
      
      document.body.appendChild(tempDiv);

      // Step 3: Convert HTML to canvas using html2canvas
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: 'white',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: 794,
        height: Math.max(1123, tempDiv.scrollHeight + 80) // A4 height or content height
      });

      // Step 4: Create PDF from canvas using jsPDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, canvas.height] // Use actual canvas dimensions
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 794, canvas.height);

      // Handle multi-page content if needed
      const contentHeight = tempDiv.scrollHeight;
      const pageHeight = 1123; // A4 height in pixels
      
      if (contentHeight > pageHeight) {
        // Split into multiple pages
        let yPosition = 0;
        let pageNumber = 0;
        
        while (yPosition < contentHeight) {
          if (pageNumber > 0) {
            pdf.addPage([794, Math.min(pageHeight, contentHeight - yPosition)]);
          }
          
          const pageCanvas = await html2canvas(tempDiv, {
            backgroundColor: 'white',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            width: 794,
            height: Math.min(pageHeight, contentHeight - yPosition),
            scrollX: 0,
            scrollY: yPosition
          });
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          
          if (pageNumber > 0) {
            pdf.addImage(pageImgData, 'PNG', 0, 0, 794, pageCanvas.height);
          }
          
          yPosition += pageHeight;
          pageNumber++;
        }
      }

      // Clean up
      document.body.removeChild(tempDiv);

      // Step 5: Generate PDF blob
      const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
      
      return {
        pdfBlob,
        fileName: file.name.replace(/\.docx$/i, '.pdf')
      };

    } catch (error) {
      console.error('Error converting DOCX to PDF:', error);
      throw new Error('Failed to convert DOCX to PDF: ' + error.message);
    }
  }
}