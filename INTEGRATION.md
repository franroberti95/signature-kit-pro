# Signature Kit Pro Integration Guide

This guide explains how to integrate `signature-kit-pro` into your other projects, leveraging the local backend for data persistence and file storage.

## 1. Prerequisites

Your project needs a **Postgres Database** (e.g., Vercel Postgres, Neon) and **Vercel Blob** configured.

### Environment Variables
Ensure your `.env.local` has:
```bash
# Database (Neon/Postgres)
DATABASE_URL="postgres://..."

# Vercel Blob (for file uploads)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# API Key for your own API (to secure endpoints)
SIGNATURE_KIT_PRO_API_KEY="sk_..."
```

## 2. Database Setup

Since this project uses raw SQL (via `@neondatabase/serverless`) instead of an ORM migration tool, you need to create the `documents` table manually in your database.

Run this SQL command in your database query editor:

```sql
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255),
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('pdf', 'rich_text')),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
```

## 3. Library Integration

### Installation
Link the local package in your consuming project's `package.json`:
```json
"dependencies": {
  "signature-kit-pro": "file:../signature-kit-pro"
}
```

### Usage Flow

The integration consists of two steps:
1.  **Start Screen:** User creates a new doc or uploads a PDF.
2.  **Builder Embed:** User edits the document.

```tsx
import { useState } from 'react';
import { PDFStartScreen, PDFBuilderEmbed } from 'signature-kit-pro';
import 'signature-kit-pro/dist/style.css';

export default function DocumentEditor() {
  const [builderData, setBuilderData] = useState(null);

  // 1. Show Start Screen initially
  if (!builderData) {
    return (
      <PDFStartScreen 
        onSuccess={(data) => {
          // data contains: { pages, format }
          // If uploaded, pages[].backgroundImage will be a Vercel Blob URL
          setBuilderData(data);
        }}
      />
    );
  }

  // 2. Show Builder when data is ready
  return (
    <PDFBuilderEmbed
      apiKey="sk_..." // Your API key
      apiBaseUrl="http://localhost:3000/api" // Your backend URL
      customerId="cust_123" // Optional: for multi-tenant apps
      initialPages={builderData.pages}
      initialFormat={builderData.format}
      onSave={(documentId) => {
        console.log("Document saved with ID:", documentId);
      }}
    />
  );
}
```

## 4. How Saving Works

1.  **Upload:** `PDFStartScreen` uploads files to `/api/upload` (Vercel Blob) and returns a permanent URL.
2.  **Edit:** `PDFBuilderEmbed` renders the PDF using that URL.
3.  **Save:** When "Save" is clicked:
    *   It calls `POST /api/documents` (first time).
    *   It saves the JSON definition (pages, elements, positions) to the `documents` table.
    *   It returns a `documentId`.
    *   Subsequent saves call `PUT /api/documents/:id` to update the existing record.
