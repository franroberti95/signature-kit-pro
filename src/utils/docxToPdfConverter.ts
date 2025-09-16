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
      const html = result.value;
      
      console.log('HTML conversion complete. Length:', html.length);
      console.log('Extracted HTML content preview:', html.substring(0, 500));
      
      // Log conversion warnings and messages
      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth conversion messages:', result.messages);
      }
      
      if (!html || html.trim().length === 0) {
        throw new Error('No content extracted from DOCX file');
      }

      // Step 2: Create PDF directly from HTML using jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Create a temporary div for measuring content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-10000px';
      tempDiv.style.left = '-10000px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.maxWidth = '210mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.5';
      tempDiv.style.color = 'black';
      tempDiv.style.wordWrap = 'break-word';
      tempDiv.style.overflow = 'visible';
      
      document.body.appendChild(tempDiv);
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Content rendered for PDF generation');
      console.log('Text content preview:', tempDiv.textContent?.substring(0, 200));

      try {
        // Use jsPDF's built-in HTML to PDF conversion
        await pdf.html(tempDiv, {
          callback: () => {
            console.log('PDF generation completed using jsPDF HTML method');
          },
          x: 0,
          y: 0,
          width: 210, // A4 width in mm
          windowWidth: 794, // Viewport width for rendering
          margin: [20, 20, 20, 20], // top, right, bottom, left margins in mm
        });
      } catch (htmlError) {
        console.warn('HTML method failed, falling back to manual method:', htmlError);
        
        // Fallback: Create canvas and convert to image
        const canvas = await html2canvas(tempDiv, {
          backgroundColor: 'white',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: 794,
          height: Math.max(tempDiv.scrollHeight, 1123),
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        
        // Handle multiple pages if content is too tall
        if (imgHeight > 297) { // A4 height in mm
          let yPosition = 297;
          let pageNum = 1;
          
          while (yPosition < imgHeight && pageNum < 10) {
            pdf.addPage();
            const remainingHeight = Math.min(297, imgHeight - yPosition);
            
            // Create a new canvas for this page section
            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d');
            pageCanvas.width = canvas.width;
            pageCanvas.height = (remainingHeight * canvas.width) / imgWidth;
            
            if (pageCtx) {
              pageCtx.drawImage(
                canvas,
                0, (yPosition * canvas.width) / imgWidth,
                canvas.width, pageCanvas.height,
                0, 0,
                canvas.width, pageCanvas.height
              );
              
              const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
              pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidth, remainingHeight);
            }
            
            yPosition += 297;
            pageNum++;
          }
        }
      }

      // Clean up
      document.body.removeChild(tempDiv);

      // Generate PDF blob
      const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
      
      console.log('PDF blob created. Size:', pdfBlob.size);
      
      // Test if the PDF blob is valid by trying to create a URL and load it
      const testUrl = URL.createObjectURL(pdfBlob);
      console.log('Created test blob URL:', testUrl);
      
      // Try to verify the PDF is valid by checking the first few bytes
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