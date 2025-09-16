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
      
      if (result.messages.length > 0) {
        console.log('Mammoth conversion messages:', result.messages);
      }
      
      // Create a temporary container to render the HTML
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '794px'; // A4 width in pixels (at 96 DPI)
      container.style.backgroundColor = 'white';
      container.style.padding = '40px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.4';
      container.innerHTML = result.value;
      
      document.body.appendChild(container);
      
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