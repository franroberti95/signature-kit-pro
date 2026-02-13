// SDK for Signature Kit Pro - API client without React dependencies
import type { PDFPage, PDFFormat } from '@/components/pdf-builder/PDFBuilder';

export interface SDKConfig {
  apiKey: string;
  apiBaseUrl?: string; // Defaults to '/api' (relative) or can be absolute URL
  customerId?: string; // Optional customer ID for multi-tenant scenarios
}

export interface Document {
  id: string;
  documentType: 'pdf' | 'rich_text';
  title: string;
  status: string;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentParams {
  documentType: 'pdf' | 'rich_text';
  title: string;
  data: {
    pages?: PDFPage[];
    format?: PDFFormat;
    [key: string]: any;
  };
}

export interface UpdateDocumentParams {
  title?: string;
  data?: any;
  status?: string;
}

export interface CreateSessionParams {
  documentId: string;
  signerEmail: string;
  signerName?: string;
  expiresAt?: string; // ISO string, defaults to 7 days
}

export interface Session {
  id: string;
  documentId: string;
  signerEmail: string;
  signerName?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  signingUrl: string;
}

class SignatureKitProSDK {
  private apiKey: string;
  private apiBaseUrl: string;
  private customerId?: string;

  constructor(config: SDKConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.apiBaseUrl = config.apiBaseUrl || '/api';
    this.customerId = config.customerId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.apiBaseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    // Add customer ID header if provided
    if (this.customerId) {
      headers['X-Customer-Id'] = this.customerId;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Documents API
  async createDocument(params: CreateDocumentParams & { customerId?: string }): Promise<{ document: Document }> {
    const payload: any = { ...params };
    if (this.customerId) {
      payload.customerId = this.customerId;
    } else if (params.customerId) {
      payload.customerId = params.customerId;
    }
    return this.request<{ document: Document }>('/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDocument(documentId: string): Promise<{ document: Document }> {
    return this.request<{ document: Document }>(`/documents/${documentId}`);
  }

  async updateDocument(
    documentId: string, 
    updates: UpdateDocumentParams
  ): Promise<{ document: Document }> {
    return this.request<{ document: Document }>(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async listDocuments(filters?: { 
    status?: string; 
    documentType?: 'pdf' | 'rich_text';
    customerId?: string;
  }): Promise<{ documents: Document[] }> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.documentType) queryParams.append('document_type', filters.documentType);
    const customerIdToUse = filters?.customerId || this.customerId;
    if (customerIdToUse) {
      queryParams.append('customer_id', customerIdToUse);
    }
    
    const query = queryParams.toString();
    return this.request<{ documents: Document[] }>(
      `/documents${query ? `?${query}` : ''}`
    );
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // Sessions API
  async createSession(params: CreateSessionParams): Promise<{ 
    session: Session; 
    signingUrl: string 
  }> {
    const expiresAt = params.expiresAt || new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(); // 7 days default

    return this.request<{ session: Session; signingUrl: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        documentId: params.documentId,
        signerEmail: params.signerEmail,
        signerName: params.signerName,
        expiresAt,
      }),
    });
  }

  async getSession(token: string): Promise<{ session: Session }> {
    return this.request<{ session: Session }>(`/sessions/${token}`);
  }

  async submitSessionForm(
    token: string, 
    formData: Record<string, any>
  ): Promise<{ message: string; sessionId: string; completedAt: string }> {
    return this.request<{ 
      message: string; 
      sessionId: string; 
      completedAt: string 
    }>(`/sessions/${token}`, {
      method: 'POST',
      body: JSON.stringify({ formData }),
    });
  }

  // Helper methods for PDF Builder
  async savePDFBuilder(
    pages: PDFPage[], 
    format: PDFFormat, 
    title?: string,
    customerId?: string
  ): Promise<{ documentId: string }> {
    const result = await this.createDocument({
      documentType: 'pdf',
      title: title || 'Untitled PDF',
      data: { pages, format },
      customerId: customerId || this.customerId,
    });
    return { documentId: result.document.id };
  }

  async loadPDFBuilder(
    documentId: string
  ): Promise<{ pages: PDFPage[]; format: PDFFormat } | null> {
    const result = await this.getDocument(documentId);
    if (!result.document?.data) return null;
    
    return {
      pages: result.document.data.pages || [],
      format: result.document.data.format || 'A4',
    };
  }
}

export default SignatureKitProSDK;

