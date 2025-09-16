import mammoth from 'mammoth';
import html2canvas from 'html2canvas';

export interface ParsedDocxPage {
  pageNumber: number;
  imageData: string; // base64 data URL
  width: number;
  height: number;
}

export class DocxParser {
  static async parseDocxFile(file: File): Promise<ParsedDocxPage[]> {
    try {
      console.log('Starting DOCX parsing...');
      
      // Convert DOCX to HTML using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      console.log('Mammoth HTML result length:', result.value.length);
      console.log('Mammoth HTML preview:', result.value.substring(0, 500));
      
      if (result.messages.length > 0) {
        console.log('Mammoth conversion messages:', result.messages);
      }
      
      // Check if we got any content
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No content extracted from DOCX file');
      }
      
      // Create a temporary container to render the HTML
      const container = document.createElement('div');
      container.style.position = 'fixed'; // Changed from absolute to fixed
      container.style.top = '0px'; // Visible for debugging
      container.style.left = '0px';
      container.style.width = '794px'; // A4 width in pixels (at 96 DPI)
      container.style.height = 'auto';
      container.style.backgroundColor = 'white';
      container.style.padding = '40px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '14px';
      container.style.lineHeight = '1.6';
      container.style.color = 'black';
      container.style.zIndex = '9999';
      container.style.border = '1px solid black'; // For debugging
      container.innerHTML = result.value;
      
      document.body.appendChild(container);
      
      // Wait a bit for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Container height after render:', container.scrollHeight);
      
      // Split content into pages based on height
      const pages = await this.splitIntoPages(container);
      
      // Clean up
      document.body.removeChild(container);
      
      console.log(`Successfully parsed DOCX into ${pages.length} pages`);
      return pages;
      
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }
  
  private static async splitIntoPages(container: HTMLElement): Promise<ParsedDocxPage[]> {
    const pages: ParsedDocxPage[] = [];
    const A4_HEIGHT = 1123; // A4 height in pixels (at 96 DPI) minus padding
    const containerHeight = container.scrollHeight;
    
    // If content fits in one page
    if (containerHeight <= A4_HEIGHT) {
      container.style.height = `${A4_HEIGHT}px`;
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 1,
        useCORS: true,
        logging: false,
        width: 794,
        height: A4_HEIGHT + 80 // Include padding
      });
      
      pages.push({
        pageNumber: 1,
        imageData: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height
      });
      
      return pages;
    }
    
    // Split content into multiple pages
    const numberOfPages = Math.ceil(containerHeight / A4_HEIGHT);
    
    for (let i = 0; i < numberOfPages; i++) {
      // Create a clipped version for each page
      const pageContainer = container.cloneNode(true) as HTMLElement;
      pageContainer.style.height = `${A4_HEIGHT}px`;
      pageContainer.style.overflow = 'hidden';
      pageContainer.style.marginTop = `-${i * A4_HEIGHT}px`;
      
      document.body.appendChild(pageContainer);
      
      try {
        const canvas = await html2canvas(pageContainer, {
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
          logging: false,
          width: 794,
          height: A4_HEIGHT + 80
        });
        
        pages.push({
          pageNumber: i + 1,
          imageData: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height
        });
        
      } finally {
        document.body.removeChild(pageContainer);
      }
    }
    
    return pages;
  }
  
  static async convertDocxToImages(file: File): Promise<string[]> {
    const pages = await this.parseDocxFile(file);
    return pages.map(page => page.imageData);
  }
}