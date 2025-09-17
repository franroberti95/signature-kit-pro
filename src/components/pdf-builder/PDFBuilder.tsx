// Type definitions for PDF Builder components

export type PDFFormat = "A4" | "A5" | "Letter";
export type ElementType = "text" | "signature" | "date" | "checkbox" | "select" | "image" | "richtext";

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
}

export interface PDFPage {
  id: string;
  format: PDFFormat;
  elements: PDFElement[];
  backgroundImage?: string | File;
}