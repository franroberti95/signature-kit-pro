import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SignatureCanvas } from "@/components/pdf-builder/SignatureCanvas";
import { DatePicker } from "@/components/pdf-builder/DatePicker";
import { toast } from "sonner";
import { ArrowLeft, Download, FileCheck, Stethoscope } from "lucide-react";

interface FormData {
  [variable: string]: string;
}

interface SignatureData {
  [variable: string]: string;
}

interface VariableType {
  name: string;
  type: 'text' | 'textarea' | 'signature' | 'date';
}

const RichTextCompletionPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState<VariableType[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [signatures, setSignatures] = useState<SignatureData>({});
  const [selectedFormat, setSelectedFormat] = useState("A4");

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('pdfBuilderData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.isRichTextDocument && data.pages[0]) {
          const page = data.pages[0];
          setContent(page.richTextContent || "");
          
          // Handle both old string array format and new object format
          const pageVariables = page.richTextVariables || [];
          if (pageVariables.length > 0) {
            // Check if it's the new format (array of objects) or old format (array of strings)
            if (typeof pageVariables[0] === 'object') {
              setVariables(pageVariables);
            } else {
              // Convert old format to new format
              const convertedVariables = pageVariables.map((name: string) => ({
                name,
                type: getVariableTypeFromName(name)
              }));
              setVariables(convertedVariables);
            }
          }
          
          setSelectedFormat(data.selectedFormat || "A4");
          
          // Initialize form data
          const initialFormData: FormData = {};
          pageVariables.forEach((variable: any) => {
            const varName = typeof variable === 'object' ? variable.name : variable;
            initialFormData[varName] = '';
          });
          setFormData(initialFormData);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error parsing stored rich text data:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Helper function to guess type from old variable names
  const getVariableTypeFromName = (name: string): 'text' | 'textarea' | 'signature' | 'date' => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('signature')) return 'signature';
    if (lowerName.includes('date') || lowerName.includes('birth')) return 'date';
    if (['medical_conditions', 'medications', 'allergies', 'treatment_description'].includes(name)) return 'textarea';
    return 'text';
  };

  const handleInputChange = (variable: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleSignatureComplete = (variable: string, signature: string) => {
    setSignatures(prev => ({
      ...prev,
      [variable]: signature
    }));
    setFormData(prev => ({
      ...prev,
      [variable]: 'Signature provided'
    }));
  };

  const getCompletedVariables = () => {
    return variables.filter(variable => formData[variable.name]?.trim()).length;
  };

  const getCompletionProgress = () => {
    if (variables.length === 0) return 100;
    return Math.round((getCompletedVariables() / variables.length) * 100);
  };

  const generatePreviewContent = () => {
    let previewContent = content;
    variables.forEach(variable => {
      let value = formData[variable.name] || `[${variable.name}]`;
      
      // Special handling for signatures and dates
      if (variable.type === 'signature' && signatures[variable.name]) {
        value = '<img src="' + signatures[variable.name] + '" style="max-height: 50px; border: 1px solid #ccc;" alt="Signature" />';
      } else if (variable.type === 'date' && formData[variable.name]) {
        value = new Date(formData[variable.name]).toLocaleDateString();
      }
      
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      previewContent = previewContent.replace(regex, `<span style="background-color: #e3f2fd; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${value}</span>`);
    });
    return previewContent;
  };

  const downloadPDF = async () => {
    try {
      // Check if all required fields are filled
      const emptyFields = variables.filter(variable => !formData[variable.name]?.trim());
      if (emptyFields.length > 0) {
        toast.error(`Please fill in: ${emptyFields.map(v => v.name).join(', ')}`);
        return;
      }

      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Create PDF with appropriate size
      let pdfFormat: any = 'a4';
      if (selectedFormat === 'A5') pdfFormat = 'a5';
      if (selectedFormat === 'Letter') pdfFormat = 'letter';
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: pdfFormat
      });

      // Create a temporary div with the final content
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'system-ui, sans-serif';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.fontSize = '14px';
      
      // Replace variables with actual values including signatures
      let finalContent = content;
      variables.forEach(variable => {
        let value = formData[variable.name] || '';
        
        if (variable.type === 'signature' && signatures[variable.name]) {
          value = `<img src="${signatures[variable.name]}" style="max-height: 50px; border: 1px solid #ccc;" alt="Signature" />`;
        } else if (variable.type === 'date' && formData[variable.name]) {
          value = new Date(formData[variable.name]).toLocaleDateString();
        }
        
        const regex = new RegExp(`{{${variable.name}}}`, 'g');
        finalContent = finalContent.replace(regex, value);
      });
      
      tempDiv.innerHTML = finalContent;
      document.body.appendChild(tempDiv);

      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Remove temp div
      document.body.removeChild(tempDiv);
      
      // Add canvas to PDF
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let remainingHeight = imgHeight;
      let yPosition = 10;
      
      // Handle multiple pages if content is too long
      while (remainingHeight > 0) {
        const canvasHeight = Math.min(remainingHeight, pageHeight - 20);
        const canvasData = canvas.getContext('2d')?.getImageData(
          0, 
          imgHeight - remainingHeight, 
          canvas.width, 
          (canvasHeight * canvas.width) / imgWidth
        );
        
        if (canvasData) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = (canvasHeight * canvas.width) / imgWidth;
          pageCanvas.getContext('2d')?.putImageData(canvasData, 0, 0);
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', 10, yPosition, imgWidth, canvasHeight);
        }
        
        remainingHeight -= canvasHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 10;
        }
      }

      // Download
      pdf.save(`completed-document-${Date.now()}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download PDF");
    }
  };

  const getFieldType = (variable: VariableType) => {
    return variable.type;
  };

  const formatVariableName = (variable: string) => {
    return variable
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (variables.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No variables found</h2>
          <p className="text-muted-foreground mb-4">Please go back and add some variables to your document.</p>
          <Button onClick={() => navigate('/rich-text-builder')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/rich-text-builder')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Complete Document
              </h1>
              <p className="text-sm text-muted-foreground">
                Fill in the variables to complete your document
              </p>
            </div>
          </div>
          <Button 
            onClick={downloadPDF}
            className="bg-green-600 hover:bg-green-700"
            disabled={getCompletionProgress() < 100}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Document Variables</span>
                  <div className="flex items-center gap-2">
                    <Progress value={getCompletionProgress()} className="w-20" />
                    <span className="text-sm text-muted-foreground">
                      {getCompletedVariables()}/{variables.length}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {variables.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={variable.name} className="text-sm font-medium">
                      {formatVariableName(variable.name)}
                    </Label>
                    {getFieldType(variable) === 'signature' ? (
                      <div className="space-y-2">
                        {signatures[variable.name] ? (
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <img 
                              src={signatures[variable.name]} 
                              alt="Signature" 
                              className="max-h-16 border"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSignatures(prev => {
                                  const newSigs = { ...prev };
                                  delete newSigs[variable.name];
                                  return newSigs;
                                });
                                setFormData(prev => ({
                                  ...prev,
                                  [variable.name]: ''
                                }));
                              }}
                              className="mt-2"
                            >
                              Clear Signature
                            </Button>
                          </div>
                        ) : (
                          <SignatureCanvas
                            width={300}
                            height={120}
                            onSignatureComplete={(signature) => handleSignatureComplete(variable.name, signature)}
                            onCancel={() => {}}
                          />
                        )}
                      </div>
                    ) : getFieldType(variable) === 'date' ? (
                      <div className="relative">
                        <Input
                          id={variable.name}
                          type="date"
                          value={formData[variable.name] || ''}
                          onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        />
                      </div>
                    ) : getFieldType(variable) === 'textarea' ? (
                      <Textarea
                        id={variable.name}
                        placeholder={`Enter ${formatVariableName(variable.name).toLowerCase()}`}
                        value={formData[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        className="min-h-[80px]"
                      />
                    ) : (
                      <Input
                        id={variable.name}
                        placeholder={`Enter ${formatVariableName(variable.name).toLowerCase()}`}
                        value={formData[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="bg-white p-6 rounded-lg border shadow-sm min-h-[600px] overflow-auto"
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}
                  dangerouslySetInnerHTML={{ __html: generatePreviewContent() }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextCompletionPage;