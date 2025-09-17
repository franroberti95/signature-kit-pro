import { useState } from "react";
import { CompletionComponent } from "@/components/completion/CompletionComponent";
import { PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/pdf-builder/SignatureCanvas";
import { toast } from "sonner";

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
}

const RichTextCompletionPage = () => {
  // Convert rich text data to PDF-like format for the completion component
  const validateRichTextData = (data: any) => {
    return data && data.isRichTextDocument && data.pages && data.pages[0];
  };

  const extractRichTextData = (data: any) => {
    const page = data.pages[0];
    const richTextVariables = page.richTextVariables || [];
    const richTextContent = page.richTextContent || "";
    
    // Convert variables to PDF elements for compatibility
    const elements: PDFElement[] = richTextVariables.map((variable: any, index: number) => {
      const varData = typeof variable === 'object' ? variable : { name: variable, type: 'text' };
      
      return {
        id: `rich-text-${varData.name}`,
        type: varData.type === 'signature' ? 'signature' : 
              varData.type === 'date' ? 'date' :
              varData.type === 'textarea' ? 'text' : 'text',
        x: 50 + (index % 3) * 200, // Distribute elements across page
        y: 100 + Math.floor(index / 3) * 100,
        width: 150,
        height: 30,
        placeholder: varData.name.replace(/_/g, ' '),
        required: true
      };
    });

    // Create the preview image synchronously first, then update async
    const virtualPage: RichTextPDFPage = {
      id: page.id || 'rich-text-page',
      format: data.selectedFormat || 'A4',
      elements,
      backgroundImage: '', // Will be populated async
      richTextContent,
      richTextVariables
    };

    // Generate the actual preview asynchronously and update the page
    createRichTextPreview(richTextContent, richTextVariables).then(imageUrl => {
      virtualPage.backgroundImage = imageUrl;
      // Force re-render by triggering a state update if possible
    });

    return {
      pages: [virtualPage],
      elements
    };
  };

  // Create a preview of the rich text content as a data URL
  const createRichTextPreview = async (content: string, variables: any[]): Promise<string> => {
    // Create a temporary container for rendering the rich text
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 794px;
      min-height: 1123px;
      padding: 40px;
      background: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      box-sizing: border-box;
    `;
    
    // Show the actual rich text content with variables as visible placeholders
    let displayContent = content;
    variables.forEach((variable: any) => {
      const varName = typeof variable === 'object' ? variable.name : variable;
      const placeholder = `<span style="background-color: #e3f2fd; border: 1px dashed #1976d2; padding: 2px 6px; border-radius: 3px; display: inline-block; min-width: 80px; text-align: center; font-weight: 500;">[${varName}]</span>`;
      displayContent = displayContent.replace(new RegExp(`{{${varName}}}`, 'g'), placeholder);
    });
    
    // Add proper styling for rich text elements
    const styledContent = `
      <div style="width: 100%; height: 100%; overflow: hidden;">
        <style>
          .ql-editor { padding: 0 !important; }
          .ql-editor p { margin-bottom: 1em; }
          .ql-editor h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; }
          .ql-editor h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; }
          .ql-editor h3 { font-size: 1.2em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; }
          .ql-editor ul, .ql-editor ol { margin-bottom: 1em; padding-left: 1.5em; }
          .ql-editor li { margin-bottom: 0.25em; }
          .ql-editor strong { font-weight: bold; }
          .ql-editor em { font-style: italic; }
          .ql-editor u { text-decoration: underline; }
          .ql-editor blockquote { border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0; }
        </style>
        <div class="ql-editor">${displayContent}</div>
      </div>
    `;
    
    container.innerHTML = styledContent;
    document.body.appendChild(container);
    
    try {
      // Use html2canvas to render the content
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        width: 794,
        height: 1123,
      });
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      
      // Clean up
      document.body.removeChild(container);
      
      return dataUrl;
    } catch (error) {
      console.error('Error creating preview:', error);
      document.body.removeChild(container);
      
      // Fallback to a simple canvas approach
      const canvas = document.createElement('canvas');
      canvas.width = 794;
      canvas.height = 1123;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        const textContent = content.replace(/<[^>]*>/g, '').substring(0, 500);
        const lines = textContent.split('\n');
        lines.forEach((line, index) => {
          if (index < 40) {
            ctx.fillText(line.substring(0, 70), 40, 60 + index * 20);
          }
        });
      }
      
      return canvas.toDataURL();
    }
  };

  // Rich text specific download handler
  const handleRichTextDownload = async (pages: PDFPage[], formData: FormData) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    const page = pages[0] as RichTextPDFPage;
    const richTextContent = page.richTextContent || "";
    const richTextVariables = page.richTextVariables || [];
    
    // Create PDF with appropriate size
    let pdfFormat: any = 'a4';
    if (page.format === 'A5') pdfFormat = 'a5';
    if (page.format === 'Letter') pdfFormat = 'letter';
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pdfFormat
    });

    // Create a temporary div with the final content
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '40px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'system-ui, sans-serif';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.fontSize = '14px';
    
    // Replace variables with actual values
    let finalContent = richTextContent;
    richTextVariables.forEach((variable: any) => {
      const varName = typeof variable === 'object' ? variable.name : variable;
      const varType = typeof variable === 'object' ? variable.type : 'text';
      const elementId = `rich-text-${varName}`;
      let value = formData[elementId] || '';
      
      if (varType === 'signature' && typeof value === 'string' && value.startsWith('data:image/')) {
        value = `<img src="${value}" style="max-height: 50px; border: 1px solid #ccc;" alt="Signature" />`;
      } else if (varType === 'date' && value) {
        value = new Date(value as string).toLocaleDateString();
      }
      
      const regex = new RegExp(`{{${varName}}}`, 'g');
      finalContent = finalContent.replace(regex, value as string);
    });
    
    tempDiv.innerHTML = finalContent;
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    // Remove temp div
    document.body.removeChild(tempDiv);
    
    // Add canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let remainingHeight = imgHeight;
    let yPosition = 10;
    
    // Handle multiple pages if content is too long
    while (remainingHeight > 0) {
      const canvasHeight = Math.min(remainingHeight, pageHeight - 20);
      
      if (remainingHeight > pageHeight - 20) {
        // Create a new canvas with just the portion we need
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = (canvasHeight * canvas.width) / imgWidth;
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0, (imgHeight - remainingHeight) * canvas.width / imgWidth,
            canvas.width, pageCanvas.height,
            0, 0,
            pageCanvas.width, pageCanvas.height
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', 10, yPosition, imgWidth, canvasHeight);
        }
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, remainingHeight);
      }
      
      remainingHeight -= canvasHeight;
      
      if (remainingHeight > 0) {
        pdf.addPage();
        yPosition = 10;
      }
    }

    // Download
    pdf.save(`completed-document-${Date.now()}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  return (
    <CompletionComponent
      sessionStorageKey="pdfBuilderData"
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