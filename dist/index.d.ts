import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { ClassProp } from 'class-variance-authority/types';
import { ClassValue } from 'clsx';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React_2 from 'react';
import { VariantProps } from 'class-variance-authority';

export declare const Button: React_2.ForwardRefExoticComponent<ButtonProps & React_2.RefAttributes<HTMLButtonElement>>;

declare interface ButtonProps extends React_2.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

declare const buttonVariants: (props?: {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "toolbar" | "toolbar-active" | "format-card" | "pdf-action";
    size?: "default" | "toolbar" | "format-card" | "sm" | "lg" | "icon";
} & ClassProp) => string;

export declare const Card: React_2.ForwardRefExoticComponent<React_2.HTMLAttributes<HTMLDivElement> & React_2.RefAttributes<HTMLDivElement>>;

export declare const CardContent: React_2.ForwardRefExoticComponent<React_2.HTMLAttributes<HTMLDivElement> & React_2.RefAttributes<HTMLDivElement>>;

export declare const CardHeader: React_2.ForwardRefExoticComponent<React_2.HTMLAttributes<HTMLDivElement> & React_2.RefAttributes<HTMLDivElement>>;

export declare const CardTitle: React_2.ForwardRefExoticComponent<React_2.HTMLAttributes<HTMLHeadingElement> & React_2.RefAttributes<HTMLParagraphElement>>;

export declare const Checkbox: React_2.ForwardRefExoticComponent<Omit<CheckboxPrimitive.CheckboxProps & React_2.RefAttributes<HTMLButtonElement>, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare function cn(...inputs: ClassValue[]): string;

export declare const CompletionComponent: ({ pages: initialPages, onBack, onComplete, onDownload, showBackButton, title, subtitle, className, }: CompletionComponentProps) => JSX_2.Element;

declare interface CompletionComponentProps {
    pages: PDFPage[];
    onBack?: () => void;
    onComplete?: (formData: FormData_2) => void;
    onDownload?: (formData: FormData_2) => Promise<void>;
    showBackButton?: boolean;
    title?: string;
    subtitle?: string;
    className?: string;
}

export declare interface CreateDocumentParams {
    documentType: 'pdf' | 'rich_text';
    title: string;
    data: {
        pages?: PDFPage[];
        format?: PDFFormat;
        [key: string]: any;
    };
}

export declare interface CreateSessionParams {
    documentId: string;
    signerEmail: string;
    signerName?: string;
    expiresAt?: string;
}

export declare const DatePicker: ({ value, onChange }: DatePickerProps) => JSX_2.Element;

declare interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
}

declare interface Document_2 {
    id: string;
    documentType: 'pdf' | 'rich_text';
    title: string;
    status: string;
    data?: any;
    createdAt: string;
    updatedAt: string;
}
export { Document_2 as Document }

export declare type ElementType = "text" | "signature" | "date" | "checkbox" | "image";

export declare const FieldEditModal: ({ element, isOpen, onClose, value, onSave }: FieldEditModalProps) => JSX_2.Element;

declare interface FieldEditModalProps {
    element: PDFElement | null;
    isOpen: boolean;
    onClose: () => void;
    value: string | boolean;
    onSave: (value: string | boolean, role?: 'source' | 'target') => void;
}

declare interface FormData_2 {
    [elementId: string]: string | boolean;
}

export declare const Input: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "ref"> & React_2.RefAttributes<HTMLInputElement>>;

export declare const InteractivePDFElement: ({ element, scale, value, onUpdate, isActive, onActivate, hideOverlay, isMobile, showHighlight, readOnly }: InteractivePDFElementProps) => JSX_2.Element;

declare interface InteractivePDFElementProps {
    element: PDFElement;
    scale: number;
    value: string | boolean;
    onUpdate: (value: string | boolean) => void;
    isActive?: boolean;
    onActivate?: () => void;
    hideOverlay?: boolean;
    isMobile?: boolean;
    showHighlight?: boolean;
    readOnly?: boolean;
}

export declare const MobileFieldNavigation: ({ elements, currentIndex, onNavigate, formData, onFieldUpdate, onDownload }: MobileFieldNavigationProps) => JSX_2.Element;

declare interface MobileFieldNavigationProps {
    elements: PDFElement[];
    currentIndex: number;
    onNavigate: (index: number) => void;
    formData: {
        [key: string]: string | boolean;
    };
    onFieldUpdate: (elementId: string, value: string | boolean) => void;
    onDownload?: () => void;
}

export declare const PDFBuilderEmbed: ({ apiKey, apiBaseUrl, customerId, initialDocumentId, onSave, onContinue, className, }: PDFBuilderEmbedProps) => JSX_2.Element;

export declare interface PDFBuilderEmbedProps {
    apiKey: string;
    apiBaseUrl?: string;
    customerId?: string;
    initialDocumentId?: string;
    onSave?: (documentId: string) => void;
    onContinue?: (documentId: string) => void;
    className?: string;
}

export declare const PDFCanvas: ({ pages, onUpdateElement, onDeleteElement, onAddElement, onAddPage, preDefinedFields }: PDFCanvasProps) => JSX_2.Element;

declare interface PDFCanvasProps {
    pages: PDFPage[];
    onUpdateElement: (pageIndex: number, elementId: string, updates: Partial<PDFElement>) => void;
    onDeleteElement: (pageIndex: number, elementId: string) => void;
    onAddElement: (pageIndex: number, element: PDFElement) => void;
    onAddPage: () => void;
    preDefinedFields?: PreDefinedFieldsConfig;
}

export declare interface PDFElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
    preDefinedValueId?: string | number;
    preDefinedLabel?: string;
    role?: 'source' | 'target';
}

export declare type PDFFormat = "A4" | "A5" | "Letter";

export declare interface PDFPage {
    id: string;
    format: PDFFormat;
    elements: PDFElement[];
    backgroundImage?: string | File;
}

export declare const PDFRenderer: ({ fileUrl, width, height, pageNumber, className }: PDFRendererProps) => JSX_2.Element;

declare interface PDFRendererProps {
    fileUrl: string | File;
    width: number;
    height: number;
    pageNumber?: number;
    className?: string;
}

declare interface PreDefinedFieldsConfig {
    text_field_options?: PreDefinedOption[];
    signature_field_options?: PreDefinedOption[];
    date_field_options?: PreDefinedOption[];
}

declare interface PreDefinedOption {
    value: string | number;
    label: string;
}

export declare const Progress: React_2.ForwardRefExoticComponent<Omit<ProgressPrimitive.ProgressProps & React_2.RefAttributes<HTMLDivElement>, "ref"> & React_2.RefAttributes<HTMLDivElement>>;

export declare const RichTextBuilderEmbed: ({ apiKey, apiBaseUrl, customerId, initialDocumentId, onSave, onContinue, className, }: RichTextBuilderEmbedProps) => JSX_2.Element;

export declare interface RichTextBuilderEmbedProps {
    apiKey: string;
    apiBaseUrl?: string;
    customerId?: string;
    initialDocumentId?: string;
    onSave?: (documentId: string) => void;
    onContinue?: (documentId: string) => void;
    className?: string;
}

export declare interface SDKConfig {
    apiKey: string;
    apiBaseUrl?: string;
    customerId?: string;
}

export declare interface Session {
    id: string;
    documentId: string;
    signerEmail: string;
    signerName?: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    signingUrl: string;
}

export declare const SignatureCanvas: ({ width, height, onSignatureComplete, onCancel }: SignatureCanvasProps) => JSX_2.Element;

declare interface SignatureCanvasProps {
    width?: number;
    height?: number;
    onSignatureComplete: (dataURL: string) => void;
    onCancel: () => void;
}

export declare class SignatureKitProSDK {
    private apiKey;
    private apiBaseUrl;
    private customerId?;
    constructor(config: SDKConfig);
    private request;
    createDocument(params: CreateDocumentParams & {
        customerId?: string;
    }): Promise<{
        document: Document_2;
    }>;
    getDocument(documentId: string): Promise<{
        document: Document_2;
    }>;
    updateDocument(documentId: string, updates: UpdateDocumentParams): Promise<{
        document: Document_2;
    }>;
    listDocuments(filters?: {
        status?: string;
        documentType?: 'pdf' | 'rich_text';
        customerId?: string;
    }): Promise<{
        documents: Document_2[];
    }>;
    deleteDocument(documentId: string): Promise<{
        message: string;
    }>;
    createSession(params: CreateSessionParams): Promise<{
        session: Session;
        signingUrl: string;
    }>;
    getSession(token: string): Promise<{
        session: Session;
    }>;
    submitSessionForm(token: string, formData: Record<string, any>): Promise<{
        message: string;
        sessionId: string;
        completedAt: string;
    }>;
    savePDFBuilder(pages: PDFPage[], format: PDFFormat, title?: string, customerId?: string): Promise<{
        documentId: string;
    }>;
    loadPDFBuilder(documentId: string): Promise<{
        pages: PDFPage[];
        format: PDFFormat;
    } | null>;
}

export declare const Textarea: React_2.ForwardRefExoticComponent<TextareaProps & React_2.RefAttributes<HTMLTextAreaElement>>;

declare interface TextareaProps extends React_2.TextareaHTMLAttributes<HTMLTextAreaElement> {
}

export declare const ToolbarPanel: ({ onAddElement }: ToolbarPanelProps) => JSX_2.Element;

declare interface ToolbarPanelProps {
    onAddElement: (type: ElementType) => void;
}

export declare interface UpdateDocumentParams {
    title?: string;
    data?: any;
    status?: string;
}

export { }
