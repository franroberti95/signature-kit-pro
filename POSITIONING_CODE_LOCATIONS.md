# 🔍 EXACT CODE LOCATIONS - Positioning Logic

## 1. BUILDER POSITIONING CODE

### 📁 `src/pages/RichTextBuilder.tsx`

**Container Dimensions** (Line ~600):
```javascript
// A4 dimensions in pixels at 72 DPI
const containerWidth = '595px';
const containerHeight = '842px';
```

**Signature Drop Handler** (Line ~520):
```javascript
const onDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const rect = containerRef.current!.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, 595 - 240));
  const y = Math.max(0, Math.min(e.clientY - rect.top, 842 - 80));
  
  const newSignature = {
    id: `signature-${Date.now()}`,
    x,  // Raw pixel from container left
    y,  // Raw pixel from container top (INCLUDES toolbar)
    width: 240,
    height: 80,
    type: 'signature' as const,
    name: signatureType
  };
};
```

**Page Content Limits** (Line ~42):
```javascript
const PAGE_LIMITS = {
  maxLines: 35,
  maxCharacters: 2380, // 68 chars per line * 35 lines
  warningThreshold: 0.8
};
```

---

## 2. PREVIEW POSITIONING CODE

### 📁 `src/components/completion/CompletionComponent.tsx`

**Desktop Positioning** (Line ~514):
```javascript
// PERCENTAGE-BASED positioning: signatures positioned relative to ACTUAL EFFECTIVE AREA
const CONTENT_WIDTH = 420;  // Actual ReactQuill effective text width
const CONTENT_HEIGHT = 714; // 842 - 2*64
const TOOLBAR_HEIGHT = 42;

const adjustedElement = element.type === 'signature' ? {
  ...element,
  // Apply toolbar adjustment, then convert to percentage for consistency
  y: element.y - TOOLBAR_HEIGHT,
  // Store percentage info for debugging (relative to content area)
  xPercent: (element.x / CONTENT_WIDTH * 100).toFixed(1),
  yPercent: ((element.y - TOOLBAR_HEIGHT) / CONTENT_HEIGHT * 100).toFixed(1)
} : element;
```

**Element Rendering** (Line ~533):
```javascript
<div
  key={element.id}
  id={`pdf-element-${element.id}`}
  className="absolute pointer-events-auto z-30"
  style={{
    left: `${element.x}px`,                    // DIRECT pixel positioning
    top: `${adjustedElement.y}px`,            // Toolbar-adjusted Y
    width: element.width ? `${element.width}px` : 'auto',
    height: element.height ? `${element.height}px` : 'auto',
  }}
>
```

**Mobile Positioning** (Line ~654 - same logic):
```javascript
const CONTENT_WIDTH = 420;  // Actual ReactQuill effective text width
const CONTENT_HEIGHT = 714; // 842 - 2*64
const TOOLBAR_HEIGHT = 42;
```

---

## 3. PDF POSITIONING CODE

### 📁 `src/pages/RichTextCompletion.tsx`

**PDF Dimensions Setup** (Line ~396):
```javascript
// Calculate PDF margins to match ACTUAL ReactQuill text wrapping behavior
const reactQuillEffectiveWidth = 420; // Reduced from 467px to match actual text wrapping
const screenContentWidth = reactQuillEffectiveWidth; 
const screenContentHeight = 842 - (2 * 64); // 714px (height is correct)
const screenRatio = screenContentWidth / screenContentHeight; // 0.588 (narrower)

// Calculate PDF content area to match actual ReactQuill behavior
const pdfContentHeight = 250; 
const pdfContentWidth = pdfContentHeight * screenRatio; // ~147mm (narrower to match)

const marginX = (pageWidth - pdfContentWidth) / 2; // ~21mm
const marginY = (pageHeight - pdfContentHeight) / 2; // ~20mm
```

**Signature Positioning** (Line ~708):
```javascript
// SIMPLE PERCENTAGE-BASED POSITIONING - use ACTUAL EFFECTIVE AREA!
// ReactQuill effective area: 420×714px (actual text wrapping area, not theoretical)
const CONTENT_WIDTH = 420;  // Actual ReactQuill effective text width
const CONTENT_HEIGHT = 714; // 842 - 2*64

// Convert stored coordinates to percentages of content area (not full container)
const xPercent = signature.x / CONTENT_WIDTH;   // % from content left edge
const yPercent = (previewY) / CONTENT_HEIGHT;   // % from content top edge (after toolbar adjustment)

// Apply same percentages to PDF content area
const pdfX = marginX + (xPercent * pdfContentWidth);
const pdfY = marginY + (yPercent * pdfContentHeight);
```

**PDF Generation** (Line ~760):
```javascript
pdf.addImage(signature.imageData, 'PNG', pdfX, pdfY, pdfWidth, pdfHeight);
```

---

## 4. CSS STYLING CODE

### 📁 `src/index.css`

**ReactQuill Container Styling** (Line ~180):
```css
.ql-container {
  border: none !important;
  font-family: 'Arial', sans-serif !important;
  font-size: 12pt !important;
  line-height: 1.6 !important;
  height: 842px !important;
  max-height: 842px !important;
  overflow: hidden !important;
}

.ql-editor {
  padding: 64px !important;  /* ALL SIDES 64px padding */
  font-family: 'Arial', sans-serif !important;
  font-size: 12pt !important;
  line-height: 1.6 !important;
  height: 842px !important;
  max-height: 842px !important;
  overflow: hidden !important;
}
```

---

## 5. COORDINATE FLOW SUMMARY

### 🏗️ Builder → Storage
```
1. User drops signature at screen position (e.clientX, e.clientY)
2. Convert to container-relative: x = clientX - containerRect.left
3. Store raw coordinates: { x: 68, y: 173 } (includes toolbar height)
```

### 👁️ Storage → Preview  
```
1. Load stored coordinates: { x: 68, y: 173 }
2. Adjust for toolbar: adjustedY = 173 - 42 = 131
3. Position element: left: 68px, top: 131px within 595×842px container
```

### 📄 Storage → PDF
```
1. Load stored coordinates: { x: 68, y: 173 }
2. Adjust for toolbar: adjustedY = 173 - 42 = 131  
3. Calculate percentages: xPercent = 68/420 = 16.2%, yPercent = 131/714 = 18.3%
4. Convert to PDF: pdfX = 31.5 + (0.162 × 147) = 55.3mm, pdfY = 23.5 + (0.183 × 250) = 69.3mm
5. Add to PDF at (55.3mm, 69.3mm)
```

---

## 6. FILES TO CHECK FOR ISSUES

1. **`RichTextBuilder.tsx`** - Lines 42, 520, 600 (dimensions, drop handler, limits)
2. **`CompletionComponent.tsx`** - Lines 514, 533, 654 (positioning logic, rendering)  
3. **`RichTextCompletion.tsx`** - Lines 396, 708, 760 (PDF dimensions, coordinate conversion)
4. **`index.css`** - Line 180 (ReactQuill styling, padding)

Review these exact locations to identify dimension/calculation mismatches!
