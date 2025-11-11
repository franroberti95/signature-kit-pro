// Main library exports
export { ToolbarPanel } from '../components/pdf-builder/ToolbarPanel';
export { PDFCanvas } from '../components/pdf-builder/PDFCanvas';
export { CompletionComponent } from './CompletionComponent';

// Embedded components (for external use with API key)
export { PDFBuilderEmbed } from './PDFBuilderEmbed';
export { RichTextBuilderEmbed } from './RichTextBuilderEmbed';
export type { PDFBuilderEmbedProps } from './PDFBuilderEmbed';
export type { RichTextBuilderEmbedProps } from './RichTextBuilderEmbed';

// SDK (API client without React dependencies)
export { default as SignatureKitProSDK } from './sdk';
export type {
  SDKConfig,
  Document,
  CreateDocumentParams,
  UpdateDocumentParams,
  CreateSessionParams,
  Session,
} from './sdk';

// Additional component exports
export { PDFRenderer } from '../components/pdf-builder/PDFRenderer';
export { SignatureCanvas } from '../components/pdf-builder/SignatureCanvas';
export { InteractivePDFElement } from '../components/pdf-builder/InteractivePDFElement';
export { MobileFieldNavigation } from '../components/pdf-builder/MobileFieldNavigation';
export { DatePicker } from '../components/pdf-builder/DatePicker';
export { FieldEditModal } from '../components/pdf-builder/FieldEditModal';

// Type exports
export type {
  PDFFormat,
  ElementType,
  PDFElement,
  PDFPage,
} from '../components/pdf-builder/PDFBuilder';

// UI component exports (commonly used)
export { Button } from '../components/ui/button';
export { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
export { Progress } from '../components/ui/progress';
export { Input } from '../components/ui/input';
export { Textarea } from '../components/ui/textarea';
export { Checkbox } from '../components/ui/checkbox';

// Utility exports
export { cn } from '../lib/utils';
