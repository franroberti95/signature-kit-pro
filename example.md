# Usage Example

## Installation

```bash
# Install from GitHub
npm install github:yourusername/signature-kit-pro
# or with specific branch/tag
npm install github:yourusername/signature-kit-pro#main
```

## Basic Usage

### 1. Import Components and Styles

```jsx
import React, { useState } from 'react';
import {
  ToolbarPanel,
  PDFCanvas,
  CompletionComponent,
  PDFPage,
  PDFElement,
  ElementType
} from 'signature-kit-pro';
import 'signature-kit-pro/dist/style.css';
```

### 2. PDF Builder Component

```jsx
function PDFBuilderApp() {
  const [pages, setPages] = useState([
    {
      id: 'page-1',
      format: 'A4',
      elements: [],
      backgroundImage: 'your-pdf-file.pdf' // or File object
    }
  ]);

  const handleAddElement = (type) => {
    const newElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'checkbox' ? 20 : 150,
      height: type === 'checkbox' ? 20 : 40,
      placeholder: `Enter ${type}...`,
    };

    const updatedPages = [...pages];
    updatedPages[0].elements.push(newElement);
    setPages(updatedPages);
  };

  const handleUpdateElement = (pageIndex, elementId, updates) => {
    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      updatedPages[pageIndex].elements[elementIndex] = {
        ...updatedPages[pageIndex].elements[elementIndex],
        ...updates,
      };
      setPages(updatedPages);
    }
  };

  const handleDeleteElement = (pageIndex, elementId) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].elements = updatedPages[pageIndex].elements.filter(
      el => el.id !== elementId
    );
    setPages(updatedPages);
  };

  return (
    <div className="flex h-screen">
      <ToolbarPanel onAddElement={handleAddElement} />
      <PDFCanvas
        pages={pages}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onAddElement={(pageIndex, element) => {
          const updatedPages = [...pages];
          updatedPages[pageIndex].elements.push(element);
          setPages(updatedPages);
        }}
        onAddPage={() => {
          const newPage = {
            id: `page-${Date.now()}`,
            format: pages[0]?.format || 'A4',
            elements: [],
          };
          setPages([...pages, newPage]);
        }}
      />
    </div>
  );
}
```

### 3. PDF Completion Component

```jsx
function PDFCompletionApp({ pages }) {
  const handleDownload = async (formData) => {
    try {
      // Use pdf-lib to generate PDF with form data
      const { PDFDocument } = await import('pdf-lib');
      
      // Load your original PDF
      const pdfDoc = await PDFDocument.load(/* your pdf bytes */);
      const pdfPages = pdfDoc.getPages();
      
      // Add form data to PDF
      pages.forEach((page, pageIndex) => {
        const pdfPage = pdfPages[pageIndex];
        const { width, height } = pdfPage.getSize();
        
        page.elements.forEach(element => {
          const value = formData[element.id];
          if (value && value !== false) {
            const x = (element.x / 595) * width;
            const y = height - ((element.y + element.height) / 842) * height;
            
            if (element.type === 'signature' && typeof value === 'string' && value.startsWith('data:image/')) {
              // Handle signature
              const base64Data = value.split(',')[1];
              const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              const pngImage = await pdfDoc.embedPng(imgBytes);
              
              pdfPage.drawImage(pngImage, {
                x,
                y,
                width: element.width / 595 * width,
                height: element.height / 842 * height,
              });
            } else if (element.type === 'checkbox' && value === true) {
              pdfPage.drawText('☑', { x, y, size: 14 });
            } else if (typeof value === 'string' && value.trim()) {
              pdfPage.drawText(value, { 
                x, 
                y, 
                size: 12,
                maxWidth: element.width / 595 * width,
              });
            }
          }
        });
      });
      
      // Download PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `completed-form-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  return (
    <CompletionComponent
      pages={pages}
      onDownload={handleDownload}
      onComplete={(formData) => {
        console.log('Form completed:', formData);
      }}
      onBack={() => {
        // Handle back navigation
        window.history.back();
      }}
      title="Complete Your PDF Form"
      subtitle="Fill out all required fields below"
      showBackButton={true}
    />
  );
}
```

### 4. Complete App Example

```jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  ToolbarPanel,
  PDFCanvas,
  CompletionComponent,
  PDFPage
} from 'signature-kit-pro';
import 'signature-kit-pro/dist/style.css';

function App() {
  const [pages, setPages] = useState([]);
  const [currentView, setCurrentView] = useState('builder'); // 'builder' or 'completion'

  // Builder functions
  const handleAddElement = (type) => {
    if (pages.length === 0) return;
    
    const newElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: type === 'checkbox' ? 20 : 150,
      height: type === 'checkbox' ? 20 : 40,
      placeholder: `Enter ${type}...`,
    };

    const updatedPages = [...pages];
    updatedPages[0].elements.push(newElement);
    setPages(updatedPages);
  };

  // ... other handler functions

  if (currentView === 'builder') {
    return (
      <div className="flex h-screen">
        <ToolbarPanel onAddElement={handleAddElement} />
        <div className="flex-1">
          <div className="p-4 border-b">
            <button
              onClick={() => setCurrentView('completion')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={pages.length === 0}
            >
              Continue to Form Completion
            </button>
          </div>
          <PDFCanvas
            pages={pages}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onAddElement={handleAddElement}
            onAddPage={handleAddPage}
          />
        </div>
      </div>
    );
  }

  return (
    <CompletionComponent
      pages={pages}
      onBack={() => setCurrentView('builder')}
      onDownload={handleDownload}
      onComplete={handleComplete}
    />
  );
}

export default App;
```

## Styling

The components use Tailwind CSS classes. Make sure you have Tailwind CSS installed in your project, or the components may not display correctly.

If you're not using Tailwind, you can still use the components, but you'll need to provide your own CSS for styling.

## TypeScript Support

The package includes TypeScript definitions. All components are fully typed:

```typescript
import type { PDFPage, PDFElement, ElementType } from 'signature-kit-pro';

const myPages: PDFPage[] = [
  {
    id: 'page-1',
    format: 'A4',
    elements: [],
    backgroundImage: undefined
  }
];
```
