import { PDFPage, PreDefinedFieldsConfig } from '@/components/pdf-builder/PDFBuilder';
import { mockPreDefinedValues, mockFormCompletionData, mockPDFTemplates } from './mockData';

// Simulate network delay for more realistic API behavior
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export interface FormCompletionData {
  [key: string]: string | boolean;
}

export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  pages: PDFPage[];
}

export class ApiService {
  // Mock API calls for pre-defined field options
  static async getPreDefinedFields(): Promise<PreDefinedFieldsConfig> {
    await simulateDelay(300);
    
    // In a real app, this would fetch from your backend
    // For now, we return the mock data
    return mockPreDefinedValues;
  }

  // Mock API call to get form completion data
  static async getFormCompletionData(formId?: string): Promise<FormCompletionData> {
    await simulateDelay(400);
    
    // In a real app, this would fetch user-specific or form-specific data
    // For now, we return mock data
    return mockFormCompletionData;
  }

  // Mock API call to save PDF template
  static async savePDFTemplate(pages: PDFPage[], templateName?: string): Promise<{ success: boolean; templateId: string }> {
    await simulateDelay(600);
    
    const templateId = `template_${Date.now()}`;
    const template = {
      id: templateId,
      name: templateName || 'Untitled Template',
      pages,
      createdAt: new Date().toISOString()
    };
    
    // Store in localStorage for now
    const existingTemplates = this.getStoredTemplates();
    existingTemplates.push(template);
    localStorage.setItem('pdf_templates', JSON.stringify(existingTemplates));
    
    return { success: true, templateId };
  }

  // Mock API call to load PDF template
  static async loadPDFTemplate(templateId: string): Promise<PDFPage[] | null> {
    await simulateDelay(300);
    
    const templates = this.getStoredTemplates();
    const template = templates.find(t => t.id === templateId);
    
    return template ? template.pages : null;
  }

  // Mock API call to get available templates
  static async getAvailableTemplates(): Promise<PDFTemplate[]> {
    await simulateDelay(400);
    
    const storedTemplates = this.getStoredTemplates();
    const allTemplates = [...mockPDFTemplates, ...storedTemplates];
    
    return allTemplates;
  }

  // Mock API call to save form completion data
  static async saveFormCompletion(formData: FormCompletionData, templateId: string): Promise<{ success: boolean; completionId: string }> {
    await simulateDelay(500);
    
    const completionId = `completion_${Date.now()}`;
    const completion = {
      id: completionId,
      templateId,
      formData,
      completedAt: new Date().toISOString()
    };
    
    // Store in localStorage for now
    const existingCompletions = this.getStoredCompletions();
    existingCompletions.push(completion);
    localStorage.setItem('form_completions', JSON.stringify(existingCompletions));
    
    return { success: true, completionId };
  }

  // Helper methods for localStorage operations
  private static getStoredTemplates(): any[] {
    try {
      return JSON.parse(localStorage.getItem('pdf_templates') || '[]');
    } catch {
      return [];
    }
  }

  private static getStoredCompletions(): any[] {
    try {
      return JSON.parse(localStorage.getItem('form_completions') || '[]');
    } catch {
      return [];
    }
  }

  // Mock API call to get PDF builder data (current session)
  static async getPDFBuilderData(): Promise<{ pages: PDFPage[]; selectedFormat: string } | null> {
    await simulateDelay(200);
    
    try {
      const data = localStorage.getItem('pdf-builder-data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Mock API call to save PDF builder data (current session)
  static async savePDFBuilderData(pages: PDFPage[], selectedFormat: string): Promise<{ success: boolean }> {
    await simulateDelay(100);
    
    const data = { pages, selectedFormat };
    localStorage.setItem('pdf-builder-data', JSON.stringify(data));
    
    return { success: true };
  }
}