# Signature Kit API Specification

This document details the API endpoints required to support the Signature Kit Pro frontend when running with an external backend.

**Base URL**: Configured via `VITE_API_URL`
**Authentication**: All requests include the header `x-api-key`.

## Endpoints

### 1. Get Pre-Defined Fields
Retrieves configuration for fields that can be pre-filled or selected in the editor.

- **URL**: `/pre-defined-fields`
- **Method**: `GET`
- **Response**: `PreDefinedFieldsConfig` object (JSON)

### 2. Get Form Completion Data
Retrieves data to pre-fill a form for a specific user or session.

- **URL**: `/completion`
- **Method**: `GET`
- **Query Params**: `?formId=<string>` (optional)
- **Response**: `FormCompletionData` object (JSON) `{[key: string]: string | boolean}`

### 3. Save Form Completion
Saves the data entered by the user into a form.

- **URL**: `/completion`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "formData": { ... },
    "templateId": "string"
  }
  ```
- **Response**: `{ "success": true, "completionId": "string" }`

### 4. Get Available Templates
Retrieves a list of PDF templates available for selection.

- **URL**: `/templates`
- **Method**: `GET`
- **Response**: Array of `PDFTemplate` objects

### 5. Load Template
Retrieves a specific PDF template by ID.

- **URL**: `/templates/:id`
- **Method**: `GET`
- **Response**: `PDFTemplate` object (or just the `pages` array if your structure differs, but the frontend expects the full object currently)

### 6. Save Template
Saves a new PDF template.

- **URL**: `/templates`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "pages": [ ... ],
    "name": "string"
  }
  ```
- **Response**: `{ "success": true, "templateId": "string" }`

### 7. Convert to PDF
Converts an uploaded document (e.g., DOCX) to PDF.

- **URL**: `/convert-to-pdf`
- **Method**: `POST`
- **Body**: `FormData` containing the file in the `file` field.
- **Response**: PDF binary blob
