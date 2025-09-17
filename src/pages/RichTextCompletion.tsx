import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SignatureCanvas } from "@/components/pdf-builder/SignatureCanvas";
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
  const [editingVariable, setEditingVariable] = useState<VariableType | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);

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

  const handleVariableClick = (variable: VariableType) => {
    setEditingVariable(variable);
    setShowFieldModal(true);
  };

  const handleFieldSave = (value: string | boolean) => {
    if (editingVariable) {
      if (editingVariable.type === 'signature') {
        setSignatures(prev => ({
          ...prev,
          [editingVariable.name]: value as string
        }));
        setFormData(prev => ({
          ...prev,
          [editingVariable.name]: 'Signature provided'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [editingVariable.name]: value as string
        }));
      }
      setShowFieldModal(false);
      setEditingVariable(null);
    }
  };

  const getCompletedVariables = () => {
    return variables.filter(variable => formData[variable.name]?.trim()).length;
  };

  const getCompletionProgress = () => {
    if (variables.length === 0) return 100;
    return Math.round((getCompletedVariables() / variables.length) * 100);
  };

  const generateInteractiveContent = () => {
    let interactiveContent = content;
    variables.forEach(variable => {
      let value = formData[variable.name];
      let displayValue = '';
      let className = 'cursor-pointer inline-block min-w-[100px] min-h-[20px] px-2 py-1 border-2 border-dashed transition-all hover:bg-blue-50';
      
      if (value && value.trim()) {
        className += ' bg-green-50 border-green-300';
      } else {
        className += ' bg-red-50 border-red-300';
      }

      if (variable.type === 'signature' && signatures[variable.name]) {
        displayValue = `<img src="${signatures[variable.name]}" style="max-height: 40px; border: 1px solid #ccc;" alt="Signature" />`;
      } else if (variable.type === 'date' && value) {
        displayValue = new Date(value).toLocaleDateString();
      } else if (value) {
        displayValue = value;
      } else {
        displayValue = `[Click to fill ${variable.name}]`;
      }
      
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      interactiveContent = interactiveContent.replace(
        regex, 
        `<span class="${className}" data-variable="${variable.name}">${displayValue}</span>`
      );
    });
    return interactiveContent;
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

  const formatVariableName = (variable: string) => {
    return variable
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderFieldInput = () => {
    if (!editingVariable) return null;

    switch (editingVariable.type) {
      case 'signature':
        return (
          <div className="space-y-4">
            <SignatureCanvas
              width={400}
              height={150}
              onSignatureComplete={(signature) => handleFieldSave(signature)}
              onCancel={() => setShowFieldModal(false)}
            />
          </div>
        );
      case 'date':
        return (
          <div className="space-y-4">
            <Label htmlFor="date-input">{formatVariableName(editingVariable.name)}</Label>
            <Input
              id="date-input"
              type="date"
              value={formData[editingVariable.name] || ''}
              onChange={(e) => handleFieldSave(e.target.value)}
              autoFocus
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-4">
            <Label htmlFor="textarea-input">{formatVariableName(editingVariable.name)}</Label>
            <Textarea
              id="textarea-input"
              placeholder={`Enter ${formatVariableName(editingVariable.name).toLowerCase()}`}
              value={formData[editingVariable.name] || ''}
              onChange={(e) => handleFieldSave(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFieldModal(false)}>Cancel</Button>
              <Button onClick={() => setShowFieldModal(false)}>Save</Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <Label htmlFor="text-input">{formatVariableName(editingVariable.name)}</Label>
            <Input
              id="text-input"
              placeholder={`Enter ${formatVariableName(editingVariable.name).toLowerCase()}`}
              value={formData[editingVariable.name] || ''}
              onChange={(e) => handleFieldSave(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && setShowFieldModal(false)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFieldModal(false)}>Cancel</Button>
              <Button onClick={() => setShowFieldModal(false)}>Save</Button>
            </div>
          </div>
        );
    }
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
                Click on any field in the document to fill it out
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Progress value={getCompletionProgress()} className="w-24" />
              <span className="text-sm text-muted-foreground">
                {getCompletedVariables()}/{variables.length}
              </span>
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
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 min-h-[600px]">
          <div 
            className="interactive-document"
            style={{
              fontFamily: 'system-ui, sans-serif',
              lineHeight: '1.6',
              fontSize: '14px'
            }}
            dangerouslySetInnerHTML={{ __html: generateInteractiveContent() }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const variableName = target.getAttribute('data-variable');
              if (variableName) {
                const variable = variables.find(v => v.name === variableName);
                if (variable) {
                  handleVariableClick(variable);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Field Edit Modal */}
      <Dialog open={showFieldModal} onOpenChange={setShowFieldModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVariable && `Fill ${formatVariableName(editingVariable.name)}`}
            </DialogTitle>
          </DialogHeader>
          {renderFieldInput()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextCompletionPage;