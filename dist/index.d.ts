import * as React from 'react';

// Core Types
export type PDFFormat = "A4" | "A5" | "Letter";
export type ElementType = "text" | "signature" | "date" | "checkbox" | "select" | "image";

export interface PDFElement {
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
}

export interface PDFPage {
  id: string;
  format: PDFFormat;
  elements: PDFElement[];
  backgroundImage?: string | File;
}

// Component Props
export interface ToolbarPanelProps {
  onAddElement: (type: ElementType) => void;
}

export interface PDFCanvasProps {
  pages: PDFPage[];
  onUpdateElement: (pageIndex: number, elementId: string, updates: Partial<PDFElement>) => void;
  onDeleteElement: (pageIndex: number, elementId: string) => void;
  onAddElement: (pageIndex: number, element: PDFElement) => void;
  onAddPage: () => void;
}

export interface CompletionComponentProps {
  pages: PDFPage[];
  onBack?: () => void;
  onComplete?: (formData: Record<string, string | boolean>) => void;
  onDownload?: (formData: Record<string, string | boolean>) => Promise<void>;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export interface PDFRendererProps {
  fileUrl: string | File;
  width: number;
  height: number;
  pageNumber?: number;
  className?: string;
}

export interface SignatureCanvasProps {
  width?: number;
  height?: number;
  onSignatureComplete: (dataURL: string) => void;
  onCancel: () => void;
}

export interface InteractivePDFElementProps {
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

export interface MobileFieldNavigationProps {
  elements: PDFElement[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  formData: Record<string, string | boolean>;
  onFieldUpdate: (elementId: string, value: string | boolean) => void;
  onDownload?: () => void;
}

// Component Declarations
export declare const ToolbarPanel: React.FC<ToolbarPanelProps>;
export declare const PDFCanvas: React.FC<PDFCanvasProps>;
export declare const CompletionComponent: React.FC<CompletionComponentProps>;
export declare const PDFRenderer: React.FC<PDFRendererProps>;
export declare const SignatureCanvas: React.FC<SignatureCanvasProps>;
export declare const InteractivePDFElement: React.FC<InteractivePDFElementProps>;
export declare const MobileFieldNavigation: React.FC<MobileFieldNavigationProps>;

// UI Components
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}
export interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

export declare const Button: React.FC<ButtonProps>;
export declare const Card: React.FC<CardProps>;
export declare const CardContent: React.FC<CardProps>;
export declare const CardHeader: React.FC<CardProps>;
export declare const CardTitle: React.FC<CardProps>;
export declare const Input: React.FC<InputProps>;
export declare const Textarea: React.FC<TextareaProps>;
export declare const Checkbox: React.FC<CheckboxProps>;
export declare const Progress: React.FC<ProgressProps>;

// Utility
export declare const cn: (...classes: (string | undefined | null | boolean)[]) => string;
