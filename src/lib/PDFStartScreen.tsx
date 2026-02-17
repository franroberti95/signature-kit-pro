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
        if (file.type !== 'application/pdf') {
            toast.error("Please upload a PDF file. DOCX is not supported.");
            return;
        }

        setIsConverting(true); // Reuse converting state for uploading
        toast("Uploading PDF...", { duration: 2000 });

        try {
            // 1. Upload to Vercel Blob via API
            const formData = new FormData();
            formData.append('file', file);

            const apiUrl = contextApiBaseUrl || 'https://signature-kit-pro.vercel.app/api';
            // NOTE: Using current origin or standard prod URL if context is missing. 
            // Ideally should be dynamic based on env but this is a library component.
            // For local dev with 'vercel dev', it handles /api relative if on same origin, 
            // but if on localhost:5173 calling localhost:3000, we need full URL.

            // Simpler strategy: Try relative '/api/upload' if we think we are in the same app, 
            // otherwise use contextUrl. 
            // But since this is a library, safer to use the passed contextApiBaseUrl or failover.
            // If contextApiBaseUrl is undefined, we might assume '/api'.

            const uploadUrl = contextApiBaseUrl ? `${contextApiBaseUrl}/upload` : '/api/upload';

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'x-api-key': contextApiKey || '',
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errText = await uploadResponse.text();
                throw new Error(`Upload failed: ${uploadResponse.status} ${errText}`);
            }

            const blobData = await uploadResponse.json();
            const pdfUrl = blobData.url;

            // 2. Load PDF locally to get page count (faster than re-fetching)
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pageCount = pdfDoc.getPageCount();

            // 3. Create Pages
            const newPages = Array.from({ length: pageCount }, (_, index) => ({
                id: `page-${Date.now()}-${index}`,
                format: "A4" as PDFFormat,
                elements: [],
                backgroundImage: pdfUrl, // Use the permanent Vercel Blob URL
                originalFileName: file.name,
                pageNumber: index + 1
            }));

            onSuccess({
                pages: newPages,
                format: "A4"
            });

            toast.success(`PDF uploaded successfully! ${pageCount} pages detected.`);

        } catch (error) {
            console.error('Error processing PDF:', error);
            toast.error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                                <p className="text-muted-foreground">Add form fields to an existing PDF document</p>
                                <FileUploader onFileUpload={handleFileUpload} isConverting={isConverting} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
