import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFRenderer } from "@/components/pdf-builder/PDFRenderer";
import { PDFFormat, ElementType, PDFElement, PDFPage } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, FileCheck, Download } from "lucide-react";

interface FormData {
  [elementId: string]: string | boolean;
}

const PDFCompletionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [allElements, setAllElements] = useState<PDFElement[]>([]);

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

  const goToNextStep = () => {
    if (currentStep < allElements.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
  }

  const currentElement = allElements[currentStep];
  const progress = ((currentStep + 1) / allElements.length) * 100;
  const isLastStep = currentStep === allElements.length - 1;

  const renderFormField = (element: PDFElement) => {
    switch (element.type) {
      case 'text':
        if (element.placeholder === 'multiline') {
          return (
            <Textarea
              placeholder="Enter text..."
              value={formData[element.id] as string || ''}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              className="w-full min-h-[100px]"
            />
          );
        } else {
          return (
            <Input
              placeholder="Enter text..."
              value={formData[element.id] as string || ''}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              className="w-full"
            />
          );
        }
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData[element.id] as boolean || false}
              onCheckedChange={(checked) => handleInputChange(element.id, !!checked)}
            />
            <label className="text-sm">Check this box</label>
          </div>
        );
      case 'signature':
        return (
          <div className="border-2 border-dashed border-muted-foreground/30 p-8 text-center bg-muted/10">
            <p className="text-sm text-muted-foreground mb-2">Signature Field</p>
            <Input
              placeholder="Type your signature or upload"
              value={formData[element.id] as string || ''}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              className="w-full"
            />
          </div>
        );
      case 'date':
        return (
          <Input
            type="date"
            value={formData[element.id] as string || ''}
            onChange={(e) => handleInputChange(element.id, e.target.value)}
            className="w-full"
          />
        );
      default:
        return (
          <Input
            placeholder="Enter value..."
            value={formData[element.id] as string || ''}
            onChange={(e) => handleInputChange(element.id, e.target.value)}
            className="w-full"
          />
        );
    }
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
                Step {currentStep + 1} of {allElements.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {isLastStep && (
              <Button onClick={handleComplete}>
                <FileCheck className="w-4 h-4 mr-2" />
                Complete
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(progress)}% completed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF Preview */}
          <div className="order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>PDF Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {pages.length > 0 && (
                  <PDFRenderer
                    fileUrl={pages[0].backgroundImage || ''}
                    width={400}
                    height={500}
                    className="w-full border rounded"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Field */}
          <div className="order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentElement.type === 'signature' && '✍️'}
                  {currentElement.type === 'text' && (currentElement.placeholder === 'multiline' ? '📄' : '📝')}
                  {currentElement.type === 'checkbox' && '☑️'}
                  {currentElement.type === 'date' && '📅'}
                  Complete this field
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Field type: {currentElement.type}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderFormField(currentElement)}
                
                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  {!isLastStep ? (
                    <Button onClick={goToNextStep}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                      <FileCheck className="w-4 h-4 mr-2" />
                      Complete Form
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Elements Overview */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Form Fields Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allElements.map((element, index) => (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        index === currentStep 
                          ? 'bg-primary/10 border border-primary/20' 
                          : formData[element.id] 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-muted/30'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {index + 1}. {element.type}
                      </span>
                      <span className="text-xs">
                        {formData[element.id] && formData[element.id] !== false ? '✅' : '⏳'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFCompletionPage;