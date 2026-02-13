import { PDFPage, PreDefinedFieldsConfig } from '@/components/pdf-builder/PDFBuilder';

export interface FormCompletionData {
  [key: string]: string | boolean;
}

export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  pages: PDFPage[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export class ApiService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getPreDefinedFields(): Promise<PreDefinedFieldsConfig> {
    return this.request<PreDefinedFieldsConfig>('/pre-defined-fields');
  }

  static async getFormCompletionData(formId?: string): Promise<FormCompletionData> {
    const query = formId ? `?formId=${formId}` : '';
    return this.request<FormCompletionData>(`/completion${query}`);
  }

  static async savePDFTemplate(pages: PDFPage[], templateName?: string): Promise<{ success: boolean; templateId: string }> {
    return this.request<{ success: boolean; templateId: string }>('/templates', {
      method: 'POST',
      body: JSON.stringify({ pages, name: templateName }),
    });
  }

  static async loadPDFTemplate(templateId: string): Promise<PDFPage[] | null> {
    try {
      const template = await this.request<PDFTemplate>(`/templates/${templateId}`);
      return template ? template.pages : null;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }

  static async getAvailableTemplates(): Promise<PDFTemplate[]> {
    return this.request<PDFTemplate[]>('/templates');
  }

  static async saveFormCompletion(formData: FormCompletionData, templateId: string): Promise<{ success: boolean; completionId: string }> {
    return this.request<{ success: boolean; completionId: string }>('/completion', {
      method: 'POST',
      body: JSON.stringify({ formData, templateId }),
    });
  }

  // Helper methods for localStorage operations (kept for local state management if needed, but primary data should be API)
  // For PDF Builder current session data, we might still want to use localStorage/sessionStorage
  // to avoid losing progress on refresh, but for now we will keep the original implementation
  // for getPDFBuilderData/savePDFBuilderData as it seems to be client-side state.

  static async getPDFBuilderData(): Promise<{ pages: PDFPage[]; selectedFormat: string } | null> {
    // This is likely client-side state, so we can keep using localStorage or move to API if backend storage is required for drafts.
    // For now, let's keep it local to match the "hand made api key" request scope which likely focuses on data persistence/retrieval.
    // If the user wants to save drafts to the server, we can update this.
    try {
      const data = localStorage.getItem('pdf-builder-data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('ApiService: Error getting PDF builder data:', error);
      return null;
    }
  }

  static async savePDFBuilderData(pages: PDFPage[], selectedFormat: string): Promise<{ success: boolean }> {
    const data = { pages, selectedFormat };
    localStorage.setItem('pdf-builder-data', JSON.stringify(data));
    sessionStorage.setItem('pdf-builder-data', JSON.stringify(data));
    return { success: true };
  }
}