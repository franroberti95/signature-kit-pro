// Type definitions for PDF Builder components

export type PDFFormat = "A4" | "A5" | "Letter";
export type ElementType = "text" | "signature" | "date" | "checkbox" | "image";

export interface PreDefinedOption {
  value: string | number;
  label: string;
}

export interface PreDefinedFieldsConfig {
  text_field_options?: PreDefinedOption[];
  signature_field_options?: PreDefinedOption[];
  date_field_options?: PreDefinedOption[];
}

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
  options?: string[]; // for select elements
  preDefinedValueId?: string | number; // ID from pre-defined options
  preDefinedLabel?: string; // Label for display
}

export interface PDFPage {
  id: string;
  format: PDFFormat;
  elements: PDFElement[];
  backgroundImage?: string | File;
}