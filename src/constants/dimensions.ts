// TRUE A4 DIMENSIONS - Centralized constants to avoid duplication and errors

// TRUE A4 at 96 DPI (web standard)
export const TRUE_A4_DIMENSIONS = {
  // Container (full page)
  CONTAINER_WIDTH: 794,   // 210mm at 96 DPI
  CONTAINER_HEIGHT: 1123, // 297mm at 96 DPI

  // Content area (with standard padding)
  PADDING: 64,
  CONTENT_WIDTH: 666,     // 794 - (2 × 64)
  CONTENT_HEIGHT: 995,    // 1123 - (2 × 64)

  // ReactQuill specific  
  TOOLBAR_HEIGHT: 83,     // ReactQuill toolbar (measured actual height from browser)

  // Signature dimensions
  SIGNATURE_WIDTH: 240,   // Fixed signature box width in pixels
  SIGNATURE_HEIGHT: 80,   // Fixed signature box height in pixels

  // PDF conversion (96 DPI)
  DPI: 96,
  MM_PER_INCH: 25.4,

  // Calculated PDF dimensions
  get PDF_CONTENT_WIDTH_MM() {
    return this.CONTENT_WIDTH * this.MM_PER_INCH / this.DPI; // 176.2mm
  },

  get PDF_CONTENT_HEIGHT_MM() {
    return this.CONTENT_HEIGHT * this.MM_PER_INCH / this.DPI; // 263.2mm
  },

  // PDF margins (centered on A4)
  get PDF_MARGIN_X_MM() {
    return (210 - this.PDF_CONTENT_WIDTH_MM) / 2; // ~16.9mm
  },

  get PDF_MARGIN_Y_MM() {
    return (297 - this.PDF_CONTENT_HEIGHT_MM) / 2; // ~16.9mm
  }
} as const;

// Helper functions for coordinate conversion
export const CoordinateHelpers = {
  // Convert builder coordinates to preview coordinates (subtract toolbar only)
  builderToPreview: (x: number, y: number) => ({
    x,
    y: y - TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT
  }),

  // Convert coordinates to percentages of content area
  toPercentages: (x: number, y: number) => ({
    xPercent: x / TRUE_A4_DIMENSIONS.CONTENT_WIDTH,
    yPercent: y / TRUE_A4_DIMENSIONS.CONTENT_HEIGHT
  }),

  // Convert percentages to PDF coordinates
  percentagesToPDF: (xPercent: number, yPercent: number) => ({
    pdfX: TRUE_A4_DIMENSIONS.PDF_MARGIN_X_MM + (xPercent * TRUE_A4_DIMENSIONS.PDF_CONTENT_WIDTH_MM),
    pdfY: TRUE_A4_DIMENSIONS.PDF_MARGIN_Y_MM + (yPercent * TRUE_A4_DIMENSIONS.PDF_CONTENT_HEIGHT_MM)
  }),

  // One-step conversion: builder coordinates → PDF coordinates
  builderToPDF: (builderX: number, builderY: number) => {
    // Convert builder coordinates (relative to full container) to content area coordinates
    const contentX = builderX - TRUE_A4_DIMENSIONS.PADDING;  // Remove left padding
    const contentY = builderY - TRUE_A4_DIMENSIONS.TOOLBAR_HEIGHT - TRUE_A4_DIMENSIONS.PADDING;  // Remove toolbar + top padding

    // Convert to percentages of content area
    const xPercent = contentX / TRUE_A4_DIMENSIONS.CONTENT_WIDTH;
    const yPercent = contentY / TRUE_A4_DIMENSIONS.CONTENT_HEIGHT;

    // Convert to PDF coordinates
    return CoordinateHelpers.percentagesToPDF(xPercent, yPercent);
  }
} as const;

// Page limits based on true A4 dimensions
export const PAGE_LIMITS = {
  maxLines: 47,
  maxCharacters: 4230, // ~90 chars per line * 47 lines
  warningThreshold: 0.8,
  avgCharsPerLine: 90,
  MAX_PAGES: 10,
  MAX_ELEMENTS_PER_PAGE: 15
} as const;
