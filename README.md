# Signature Kit Pro

A comprehensive React library for building interactive PDF forms with signature capabilities, built with TypeScript and modern React patterns.

## Features

- 🖋️ **Interactive PDF Forms** - Click-to-edit form fields directly on PDF documents
- ✍️ **Digital Signatures** - Built-in signature pad with canvas drawing
- 📱 **Mobile Responsive** - Optimized for both desktop and mobile experiences  
- 🎨 **Customizable UI** - Built with shadcn/ui components, fully customizable
- 📄 **Multi-page Support** - Handle complex multi-page PDF documents
- 🔧 **TypeScript** - Full type safety and excellent DX
- 📦 **Easy Integration** - Simple components that work with your existing React app

## Installation

### From GitHub (Recommended)

```bash
# Replace 'yourusername' with the actual GitHub username/org
npm install github:yourusername/signature-kit-pro
# or
yarn add github:yourusername/signature-kit-pro
# or  
pnpm add github:yourusername/signature-kit-pro

# Install from a specific branch (optional)
yarn add github:yourusername/signature-kit-pro#main
# or from a specific tag/release
yarn add github:yourusername/signature-kit-pro#v1.0.0
```

### Peer Dependencies

Make sure you have React installed in your project:

```bash
npm install react@>=18.0.0 react-dom@>=18.0.0
# or
yarn add react@>=18.0.0 react-dom@>=18.0.0
```

### ⚠️ Important Notes

- The built files are committed to the repository, so installation from GitHub will work immediately
- No build step required after installation
- TypeScript declarations are included

## Quick Start

### 1. Basic PDF Builder

```tsx
import React, { useState } from 'react';
import { ToolbarPanel, PDFCanvas, PDFPage } from 'signature-kit-pro';
import 'signature-kit-pro/dist/style.css';

function PDFBuilder() {
  const [pages, setPages] = useState<PDFPage[]>([]);

  const addElement = (type: ElementType) => {
    // Add element to current page
  };

  const updateElement = (pageIndex: number, elementId: string, updates: any) => {
    // Update element logic
  };

  return (
    <div className="flex h-screen">
      <ToolbarPanel onAddElement={addElement} />
      <PDFCanvas
        pages={pages}
        onUpdateElement={updateElement}
        onDeleteElement={() => {}}
        onAddElement={() => {}}
        onAddPage={() => {}}
      />
    </div>
  );
}
```

### 2. PDF Completion Form

```tsx
import React from 'react';
import { CompletionComponent, PDFPage } from 'signature-kit-pro';
import 'signature-kit-pro/dist/style.css';

function PDFCompletion({ pages }: { pages: PDFPage[] }) {
  const handleDownload = async (formData: Record<string, string | boolean>) => {
    // Handle PDF download with form data
    console.log('Form data:', formData);
  };

  const handleComplete = (formData: Record<string, string | boolean>) => {
    // Handle form completion
    console.log('Form completed:', formData);
  };

  return (
    <CompletionComponent
      pages={pages}
      onDownload={handleDownload}
      onComplete={handleComplete}
      title="Complete Your Form"
      subtitle="Fill out all required fields"
    />
  );
}
```

## Components

### ToolbarPanel

A sidebar component with tools for adding different types of form elements.

```tsx
<ToolbarPanel
  onAddElement={(type) => {
    // Handle adding new element of specified type
  }}
/>
```

### PDFCanvas

The main canvas component for building and editing PDF forms.

```tsx
<PDFCanvas
  pages={pages}
  onUpdateElement={(pageIndex, elementId, updates) => {}}
  onDeleteElement={(pageIndex, elementId) => {}}
  onAddElement={(pageIndex, element) => {}}
  onAddPage={() => {}}
/>
```

### CompletionComponent

Complete form component for filling out PDF forms.

```tsx
<CompletionComponent
  pages={pages}
  onDownload={async (formData) => {
    // Download logic
  }}
  onComplete={(formData) => {
    // Completion logic
  }}
  title="Custom Title"
  showBackButton={true}
/>
```

## Types

### PDFElement

```tsx
interface PDFElement {
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
```

### PDFPage

```tsx
interface PDFPage {
  id: string;
  format: PDFFormat;
  elements: PDFElement[];
  backgroundImage?: string | File;
}
```

### ElementType

```tsx
type ElementType = "text" | "signature" | "date" | "checkbox" | "select" | "image";
```

## Advanced Usage

### Custom Styling

The components use Tailwind CSS classes. You can customize the appearance by:

1. **Override CSS classes** - Components accept `className` props
2. **Use CSS variables** - Customize the built-in theme variables
3. **Custom theme** - Integrate with your existing design system

```tsx
<CompletionComponent
  pages={pages}
  className="my-custom-theme"
  // ... other props
/>
```

### Form Validation

```tsx
const validateForm = (formData: Record<string, string | boolean>) => {
  const requiredFields = pages
    .flatMap(page => page.elements)
    .filter(element => element.required);

  const missingFields = requiredFields.filter(
    field => !formData[field.id] || formData[field.id] === ''
  );

  return missingFields.length === 0;
};
```

### PDF Generation

```tsx
import { PDFDocument } from 'pdf-lib';

const generatePDF = async (pages: PDFPage[], formData: Record<string, any>) => {
  const pdfDoc = await PDFDocument.create();
  
  // Add your PDF generation logic here
  for (const page of pages) {
    const pdfPage = pdfDoc.addPage();
    
    for (const element of page.elements) {
      const value = formData[element.id];
      if (value) {
        // Add element to PDF based on type
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)  
- Safari (last 2 versions)
- Edge (last 2 versions)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report bugs](https://github.com/yourusername/signature-kit-pro/issues)
- 💡 [Request features](https://github.com/yourusername/signature-kit-pro/issues)
- 📖 [Documentation](https://github.com/yourusername/signature-kit-pro/wiki)