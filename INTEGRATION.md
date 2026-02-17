# Signature Kit Pro Integration Guide

This guide provides everything you need to know to integrate `signature-kit-pro` into your Next.js or React application.

**Copy this file to your other project's `.cursorrules`, `.agent/knowledge`, or simply point your AI assistant to it.**

## 1. Installation

If you are using the private registry or local linking:

```bash
npm install signature-kit-pro
# or
yarn add signature-kit-pro
```

## 2. Frontend Integration (React/Next.js)

### Setup Provider
Wrap your application root with `SignatureKitProvider`. This context handles the API key and configuration globally.

```tsx
// src/app/layout.tsx
'use client';
import { SignatureKitProvider } from 'signature-kit-pro';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SignatureKitProvider 
          apiKey={process.env.NEXT_PUBLIC_SIGNATURE_KIT_API_KEY!}
          apiBaseUrl={process.env.NEXT_PUBLIC_SIGNATURE_KIT_API_URL} // Optional, defaults to /api
        >
          {children}
        </SignatureKitProvider>
      </body>
    </html>
  );
}
```

### Using the PDF Builder
Import and use the `PDFBuilderEmbed` component. It automatically uses the context configuration.

```tsx
// src/app/builder/page.tsx
'use client';
import { PDFBuilderEmbed } from 'signature-kit-pro';
import 'signature-kit-pro/dist/style.css'; // Don't forget CSS!

export default function BuilderPage() {
  return (
    <div className="h-screen w-full">
      <PDFBuilderEmbed 
        onSave={(documentId) => console.log('Saved document:', documentId)}
        onContinue={(documentId) => console.log('Proceed to signing:', documentId)}
        // Optional: override context
        // apiKey="special-key" 
      />
    </div>
  );
}
```

## 3. Backend Integration (Node.js/Next.js API Routes)

Use the SDK to interact with the Signature Kit services programmatically (e.g., creating signing sessions, downloading PDFs).

```typescript
import { SignatureKitProSDK } from 'signature-kit-pro/sdk'; 
// Or sometimes just: import { SignatureKitProSDK } from 'signature-kit-pro';

const sdk = new SignatureKitProSDK({
  apiKey: process.env.SIGNATURE_KIT_API_KEY!,
  apiBaseUrl: 'https://api.signaturekit.pro', // Your backend URL
});

// Example: Create a signing session
export async function createSession(documentId: string, email: string) {
  const { session, signingUrl } = await sdk.createSession({
    documentId,
    signerEmail: email,
    signerName: 'John Doe',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  return signingUrl;
}

// Example: Get a document
export async function getDocument(id: string) {
  const { document } = await sdk.getDocument(id);
  return document;
}
```

## 4. Required Backend API Endpoints

If you are hosting the backend yourself (not using a managed service), you must implement these endpoints to support `PDFBuilderEmbed`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/documents` | Create/Save a document (pages, format, etc.) |
| `GET` | `/documents/:id` | Load a document |
| `GET` | `/pre-defined-fields` | (Optional) Get fields for drag-and-drop |
| `POST` | `/convert-to-pdf` | (Optional) Convert DOCX/Images to PDF background |

## 5. TypeScript Definitions

The library exports full TypeScript definitions. Key interfaces:

```typescript
export interface PDFPage {
  id: string;
  format: "A4" | "A5" | "Letter";
  elements: PDFElement[];
  backgroundImage?: string;
}

export interface PDFElement {
  id: string;
  type: "text" | "signature" | "date" | "checkbox";
  x: number;
  y: number;
  width: number;
  height: number;
  required?: boolean;
}
```
