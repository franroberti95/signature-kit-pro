import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFRenderer } from "@/components/pdf-builder/PDFRenderer";
import { InteractivePDFElement } from "@/components/pdf-builder/InteractivePDFElement";
import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { ArrowLeft, FileCheck, Download, Eye, EyeOff } from "lucide-react";

interface FormData {
  [elementId: string]: string | boolean;
}

const PDFCompletionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [allElements, setAllElements] = useState<PDFElement[]>([]);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('pdfBuilderData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        let pagesData = data.pages || [];
        
        // If there was an uploaded file passed via navigation state
        if (location.state?.uploadedFile) {
          pagesData = pagesData.map((page: PDFPage) => ({
            ...page,
            backgroundImage: location.state.uploadedFile
          }));
        }
        
        setPages(pagesData);
        
        // Collect all form elements from all pages
        const elements: PDFElement[] = [];
        pagesData.forEach((page: PDFPage) => {
          elements.push(...page.elements);
        });
        setAllElements(elements);
        
        // Initialize form data
        const initialFormData: FormData = {};
        elements.forEach(element => {
          initialFormData[element.id] = element.type === 'checkbox' ? false : '';
        });
        setFormData(initialFormData);
        
      } catch (error) {
        console.error('Error parsing stored PDF builder data:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate, location.state]);

  const handleInputChange = (elementId: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const handleComplete = () => {
    toast.success("PDF completed successfully!");
    // Here you would typically save the completed PDF or send it somewhere
    console.log("Completed form data:", formData);
  };

  const downloadPDF = () => {
    toast.success("PDF download started!");
    // Here you would generate and download the completed PDF
  };

  const getCompletionProgress = () => {
    const completedFields = allElements.filter(element => {
      const value = formData[element.id];
      return value !== "" && value !== false && value !== null && value !== undefined;
    }).length;
    return Math.round((completedFields / allElements.length) * 100);
  };

  if (pages.length === 0 || allElements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No form elements found</h2>
          <p className="text-muted-foreground mb-4">Please go back and add some form elements to your PDF.</p>
          <Button onClick={() => navigate('/pdf-builder')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Builder
          </Button>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/pdf-builder')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Complete PDF Form</h1>
              <p className="text-sm text-muted-foreground">
                Click directly on the PDF to fill out fields
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowOverlay(!showOverlay)}
              className="flex items-center gap-2"
            >
              {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOverlay ? 'Hide Fields' : 'Show Fields'}
            </Button>
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleComplete}>
              <FileCheck className="w-4 h-4 mr-2" />
              Complete
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={getCompletionProgress()} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {getCompletionProgress()}% completed ({allElements.filter(el => formData[el.id] && formData[el.id] !== false).length} of {allElements.length} fields)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF with Interactive Elements */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive PDF</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on the highlighted areas to fill out the form
                </p>
              </CardHeader>
              <CardContent>
                <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                  {pages.length > 0 && (
                    <>
                      <PDFRenderer
                        fileUrl={pages[0].backgroundImage || ''}
                        width={600}
                        height={750}
                        className="w-full"
                      />
                      
                      {/* Interactive Elements Overlay */}
                      {showOverlay && pages[0].elements.map((element) => (
                        <InteractivePDFElement
                          key={element.id}
                          element={element}
                          scale={600 / 595} // A4 width scale factor
                          value={formData[element.id] || ''}
                          onUpdate={(value) => handleInputChange(element.id, value)}
                          isActive={activeElement === element.id}
                          onActivate={() => setActiveElement(element.id)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fields Overview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your progress
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allElements.map((element, index) => {
                    const hasValue = formData[element.id] && formData[element.id] !== false;
                    return (
                      <div
                        key={element.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          activeElement === element.id 
                            ? 'bg-primary/10 border-primary' 
                            : hasValue
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveElement(element.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            hasValue 
                              ? 'bg-green-500 text-white' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {hasValue ? '✓' : index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {element.type}
                            </p>
                            {element.placeholder && (
                              <p className="text-xs text-muted-foreground">
                                {element.placeholder}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs">
                          {hasValue ? '✅' : '⏳'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {getCompletionProgress() === 100 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      🎉 All fields completed!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      You can now download or submit your PDF.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFCompletionPage;