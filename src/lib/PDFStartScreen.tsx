import { useState } from "react";
import { FileUploader } from "@/components/pdf-builder/FileUploader";
import { PDFFormat, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { PDFDocument } from 'pdf-lib';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { useSignatureKit } from "@/contexts/SignatureKitContext";

interface PDFStartScreenProps {
    onSuccess: (data: { pages: PDFPage[]; format: PDFFormat }) => void;
    className?: string;
}

export const PDFStartScreen = ({ onSuccess, className = "" }: PDFStartScreenProps) => {
    const [isConverting, setIsConverting] = useState(false);
    const { apiKey: contextApiKey, apiBaseUrl: contextApiBaseUrl } = useSignatureKit();

    const handleCreateNew = () => {
        // Create a blank A4 page
        const initialPage: PDFPage = {
            id: `page-${Date.now()}`,
            format: "A4",
            elements: [],
        };

        onSuccess({
            pages: [initialPage],
            format: "A4"
        });

        toast("New A4 document created!");
    };

    const handleFileUpload = async (file: File) => {
        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            // Handle non-PDF file - send to backend for conversion
            await handleNonPdfUpload(file);
        } else if (file.type === 'application/pdf') {
            // Handle PDF file - detect page count and create pages
            try {
                const blobUrl = URL.createObjectURL(file);

                // Load the PDF to get page count
                const pdfBytes = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const pageCount = pdfDoc.getPageCount();

                // Create page objects for each page in the PDF
                const newPages = Array.from({ length: pageCount }, (_, index) => ({
                    id: `page-${Date.now()}-${index}`,
                    format: "A4" as PDFFormat,
                    elements: [],
                    backgroundImage: blobUrl,
                    originalFileName: file.name,
                    pageNumber: index + 1
                }));

                onSuccess({
                    pages: newPages,
                    format: "A4"
                });

                toast(`PDF "${file.name}" loaded successfully! ${pageCount} pages detected.`);
            } catch (error) {
                console.error('Error processing PDF:', error);
                toast.error("Failed to process PDF file");
            }
        } else {
            toast.error("Please upload a PDF or DOCX file");
        }
    };

    const handleNonPdfUpload = async (file: File) => {
        setIsConverting(true);

        try {
            toast("Converting document to PDF...", { duration: 3000 });

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);

            // Use the configured API URL from context or override
            const apiUrl = contextApiBaseUrl || 'https://api.signaturekit.pro/api';
            // Fallback API URL should ideally be the production one if not specified

            const apiKey = contextApiKey || '';

            if (!apiKey) {
                console.warn("SignatureKitPro: No API key available for conversion");
            }

            const response = await fetch(`${apiUrl}/convert-to-pdf`, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Conversion failed: ${response.statusText}`);
            }

            // Get the converted PDF blob from the response
            const pdfBlob = await response.blob();

            // Load the PDF to get page count
            const pdfBytes = await pdfBlob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pageCount = pdfDoc.getPageCount();

            // Create a blob URL for the converted PDF
            const blobUrl = URL.createObjectURL(pdfBlob);

            // Create page objects for each page in the PDF
            const newPages = Array.from({ length: pageCount }, (_, index) => ({
                id: `page-${Date.now()}-${index}`,
                format: "A4" as PDFFormat,
                elements: [],
                backgroundImage: blobUrl,
                originalFileName: file.name,
                pageNumber: index + 1
            }));

            onSuccess({
                pages: newPages,
                format: "A4"
            });

            toast(`Document converted to PDF successfully! "${file.name}" loaded with ${pageCount} pages.`, {
                duration: 3000
            });

        } catch (error) {
            console.error('Error converting file:', error);
            toast.error(`Failed to convert file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className={`min-h-screen bg-background ${className}`}>
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Get Started</h2>
                        <p className="text-lg text-muted-foreground">Choose how you want to create your PDF document</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={handleCreateNew}>
                            <CardHeader className="pb-4 pointer-events-none">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Create New Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pointer-events-none">
                                <p className="text-muted-foreground">Start with a blank A4 document and build your form from scratch</p>
                                <Button
                                    className="w-full pointer-events-none"
                                    size="lg"
                                    variant="secondary"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Create New A4 Document
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="p-6">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Upload Existing PDF
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">Add form fields to an existing PDF or Word document</p>
                                <FileUploader onFileUpload={handleFileUpload} isConverting={isConverting} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
