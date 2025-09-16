import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class DocxToPdfConverter {
  // Test method to verify PDF generation works
  static async testPdfGeneration(): Promise<{ pdfBlob: Blob; fileName: string }> {
    console.log('Testing PDF generation with simple HTML...');
    
    const testHtml = `
      <h1>Test Document</h1>
      <p>This is a test paragraph to verify PDF generation works.</p>
      <p>Line 1 of content</p>
      <p>Line 2 of content</p>
      <p>Line 3 of content</p>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = testHtml;
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '-10000px';
    tempDiv.style.left = '-10000px';
    tempDiv.style.width = '794px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.color = 'black';
    
    document.body.appendChild(tempDiv);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    const pageWidth = 794;
    const pageHeight = 1123;
    
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: 'white',
      scale: 1.0,
      useCORS: true,
      allowTaint: true,
      width: pageWidth,
      height: pageHeight,
      logging: true
    });
    
    const imgData = canvas.toDataURL('image/png', 0.95);
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    
    document.body.removeChild(tempDiv);
    
    const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
    console.log('Test PDF created. Size:', pdfBlob.size);
    
    return {
      pdfBlob,
      fileName: 'test.pdf'
    };
  }

  static async convertDocxToPdf(file: File): Promise<{ pdfBlob: Blob; fileName: string }> {
    console.log('Starting DOCX to PDF conversion for file:', file.name, 'Size:', file.size);
    
    try {
      // Step 1: Convert DOCX to HTML using mammoth
      console.log('Converting DOCX to HTML...');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      let html = result.value;
      
      console.log('HTML conversion complete. Length:', html.length);
      console.log('Extracted HTML content preview:', html.substring(0, 500));
      
      // Log conversion warnings and messages
      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth conversion messages:', result.messages);
      }
      
      if (!html || html.trim().length === 0) {
        throw new Error('No content extracted from DOCX file');
      }

      // Step 2: Clean and optimize HTML for PDF conversion
      // Remove problematic elements and improve formatting
      html = html
        .replace(/<img[^>]*>/g, '') // Remove images to reduce file size
        .replace(/<style[^>]*>.*?<\/style>/gs, '') // Remove style tags
        .replace(/style="[^"]*"/g, '') // Remove inline styles
        .replace(/<\/p>/g, '</p><br/>') // Add spacing between paragraphs
        .trim();

      // Step 3: Create PDF using jsPDF's HTML method for lightweight output
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Use jsPDF's html method for efficient, text-based PDF generation
      await new Promise<void>((resolve, reject) => {
        pdf.html(html, {
          callback: (doc) => {
            console.log('PDF generation completed using HTML method');
            resolve();
          },
          x: 15,
          y: 15,
          width: 180, // A4 width minus margins (210mm - 30mm)
          windowWidth: 650,
          margin: [15, 15, 15, 15] // [top, right, bottom, left]
        });
      });

      // Generate PDF blob
      const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
      
      console.log('PDF blob created. Size:', pdfBlob.size);
      
      // Verify the PDF is valid
      const testBytes = await pdfBlob.slice(0, 10).arrayBuffer();
      const testView = new Uint8Array(testBytes);
      const isValidPdf = testView[0] === 0x25 && testView[1] === 0x50 && testView[2] === 0x44 && testView[3] === 0x46; // %PDF
      console.log('PDF blob appears valid (starts with %PDF):', isValidPdf);
      
      if (!isValidPdf) {
        console.error('Generated PDF blob does not appear to be a valid PDF!');
        throw new Error('Generated PDF is invalid');
      }
      
      return {
        pdfBlob,
        fileName: file.name.replace(/\.docx$/i, '.pdf')
      };

    } catch (error) {
      console.error('Error converting DOCX to PDF:', error);
      throw new Error(`Failed to convert DOCX to PDF: ${error.message}`);
    }
  }
}