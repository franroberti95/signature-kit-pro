import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Variable, X, Stethoscope, Heart, Calendar, Shield } from "lucide-react";
import RichTextEditor from "@/components/pdf-builder/RichTextEditor";

type PDFFormat = "A4" | "A5" | "Letter";

interface VariableType {
  name: string;
  type: 'text' | 'textarea' | 'signature' | 'date';
}

const DENTAL_TEMPLATES = {
  consent: {
    name: "Dental Consent Form",
    icon: Shield,
    variables: [
      { name: "patient_name", type: "text" as const },
      { name: "patient_id", type: "text" as const },
      { name: "dentist_name", type: "text" as const },
      { name: "treatment_type", type: "textarea" as const },
      { name: "appointment_date", type: "date" as const },
      { name: "patient_signature", type: "signature" as const },
      { name: "doctor_signature", type: "signature" as const }
    ],
    content: `<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #dc3545; padding-bottom: 15px;">
  <h1 style="color: #dc3545; font-size: 24px; margin: 0; font-weight: bold;">INFORMED CONSENT FOR DENTAL TREATMENT</h1>
</div>

<div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
  <div><strong>Patient:</strong><br><span style="color: #dc3545; font-weight: bold;">{{patient_name}}</span> (ID: {{patient_id}})</div>
  <div><strong>Doctor:</strong><br><span style="color: #dc3545; font-weight: bold;">Dr. {{dentist_name}}</span></div>
  <div><strong>Date:</strong><br><span style="border-bottom: 2px dotted #666; padding-bottom: 2px; display: inline-block;">{{appointment_date}}</span></div>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 5px; margin-bottom: 15px;">Treatment Information</h3>
  
  <div style="margin-bottom: 20px;">
    <strong>Proposed Treatment:</strong>
    <div style="border: 2px solid #dc3545; border-radius: 5px; padding: 15px; margin-top: 8px; min-height: 80px; background-color: #fff;">
      {{treatment_type}}
    </div>
  </div>
  
  <div style="padding: 20px; border: 2px solid #ffc107; border-radius: 8px; background-color: #fff3cd; margin-bottom: 20px;">
    <h4 style="color: #856404; margin: 0 0 10px 0;">I understand and acknowledge that:</h4>
    <ul style="margin: 0; color: #856404; line-height: 1.5;">
      <li>No guarantee has been made as to the outcome of treatment</li>
      <li>I have been informed of alternative treatments, their benefits and risks</li>
      <li>I have been informed of the risks of not receiving treatment</li>
      <li>I have had the opportunity to ask questions regarding the treatment</li>
    </ul>
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px;">
  <div style="text-align: center; padding: 20px; border: 2px solid #28a745; border-radius: 8px; background-color: #d4edda;">
    <strong style="color: #155724;">Patient Signature</strong><br>
    <div style="margin: 15px 0; min-height: 60px; border-bottom: 2px solid #155724;">
      {{patient_signature}}
    </div>
    <span style="color: #155724; font-size: 12px;">Date: {{appointment_date}}</span>
  </div>
  
  <div style="text-align: center; padding: 20px; border: 2px solid #17a2b8; border-radius: 8px; background-color: #d1ecf1;">
    <strong style="color: #0c5460;">Doctor Signature</strong><br>
    <div style="margin: 15px 0; min-height: 60px; border-bottom: 2px solid #0c5460;">
      {{doctor_signature}}
    </div>
    <span style="color: #0c5460; font-size: 12px;">Dr. {{dentist_name}}</span>
  </div>
</div>`
  },
  history: {
    name: "Medical History",
    icon: Heart,
    variables: [
      { name: "patient_name", type: "text" as const },
      { name: "patient_id", type: "text" as const },
      { name: "date_of_birth", type: "date" as const },
      { name: "phone_number", type: "text" as const },
      { name: "email_address", type: "text" as const },
      { name: "medical_conditions", type: "textarea" as const },
      { name: "medications", type: "textarea" as const },
      { name: "allergies", type: "textarea" as const },
      { name: "patient_signature", type: "signature" as const }
    ],
    content: `<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #28a745; padding-bottom: 15px;">
  <h1 style="color: #28a745; font-size: 24px; margin: 0; font-weight: bold;">MEDICAL HISTORY FORM</h1>
</div>

<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
  <div><strong>Patient:</strong><br><span style="color: #28a745; font-weight: bold;">{{patient_name}}</span> (ID: {{patient_id}})</div>
  <div><strong>Date of Birth:</strong><br><span style="color: #28a745; font-weight: bold;">{{date_of_birth}}</span></div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
  <div style="padding: 15px; border: 2px solid #17a2b8; border-radius: 8px; background-color: #d1ecf1;">
    <strong style="color: #0c5460;">Phone:</strong><br>
    <span style="font-size: 16px; color: #0c5460;">{{phone_number}}</span>
  </div>
  <div style="padding: 15px; border: 2px solid #6f42c1; border-radius: 8px; background-color: #e2d9f3;">
    <strong style="color: #3d1a78;">Email:</strong><br>
    <span style="font-size: 16px; color: #3d1a78;">{{email_address}}</span>
  </div>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 5px; margin-bottom: 15px;">Medical Information</h3>
  
  <div style="margin-bottom: 20px;">
    <strong>Current Medical Conditions:</strong>
    <div style="border: 2px solid #ddd; border-radius: 5px; padding: 15px; margin-top: 8px; min-height: 60px; background-color: #fff;">
      {{medical_conditions}}
    </div>
  </div>
  
  <div style="margin-bottom: 20px;">
    <strong>Current Medications:</strong>
    <div style="border: 2px solid #ddd; border-radius: 5px; padding: 15px; margin-top: 8px; min-height: 60px; background-color: #fff;">
      {{medications}}
    </div>
  </div>
  
  <div style="margin-bottom: 20px;">
    <strong>Known Allergies:</strong>
    <div style="border: 2px solid #dc3545; border-radius: 5px; padding: 15px; margin-top: 8px; min-height: 60px; background-color: #f8d7da;">
      {{allergies}}
    </div>
  </div>
</div>

<div style="margin-top: 40px; padding: 20px; border: 2px solid #28a745; border-radius: 8px; background-color: #d4edda;">
  <h3 style="color: #155724; margin-bottom: 15px;">Patient Acknowledgment</h3>
  <p style="line-height: 1.6; margin: 0; color: #155724;">
    I certify that the above information is complete and accurate to the best of my knowledge. I understand that providing false information may be dangerous to my health.
  </p>
</div>`
  },
  plan: {
    name: "Treatment Plan",
    icon: Calendar,
    variables: [
      { name: "patient_name", type: "text" as const },
      { name: "patient_id", type: "text" as const },
      { name: "dentist_name", type: "text" as const },
      { name: "treatment_description", type: "textarea" as const },
      { name: "estimated_cost", type: "text" as const },
      { name: "treatment_duration", type: "text" as const },
      { name: "appointment_date", type: "date" as const }
    ],
    content: `<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #6f42c1; padding-bottom: 15px;">
  <h1 style="color: #6f42c1; font-size: 24px; margin: 0; font-weight: bold;">DENTAL TREATMENT PLAN</h1>
</div>

<div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
  <div><strong>Patient:</strong><br><span style="color: #6f42c1; font-weight: bold;">{{patient_name}}</span> (ID: {{patient_id}})</div>
  <div><strong>Doctor:</strong><br><span style="color: #6f42c1; font-weight: bold;">Dr. {{dentist_name}}</span></div>
  <div><strong>Date:</strong><br><span style="border-bottom: 2px dotted #666; padding-bottom: 2px; display: inline-block;">{{appointment_date}}</span></div>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #6f42c1; border-bottom: 2px solid #6f42c1; padding-bottom: 5px; margin-bottom: 15px;">Proposed Treatment</h3>
  
  <div style="margin-bottom: 20px;">
    <strong>Treatment Description:</strong>
    <div style="border: 2px solid #6f42c1; border-radius: 5px; padding: 15px; margin-top: 8px; min-height: 80px; background-color: #fff;">
      {{treatment_description}}
    </div>
  </div>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
    <div style="padding: 15px; border: 2px solid #28a745; border-radius: 8px; background-color: #d4edda;">
      <strong style="color: #155724;">Estimated Cost:</strong><br>
      <span style="font-size: 18px; font-weight: bold; color: #155724;">{{estimated_cost}}</span>
    </div>
    <div style="padding: 15px; border: 2px solid #17a2b8; border-radius: 8px; background-color: #d1ecf1;">
      <strong style="color: #0c5460;">Expected Duration:</strong><br>
      <span style="font-size: 18px; font-weight: bold; color: #0c5460;">{{treatment_duration}}</span>
    </div>
  </div>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #6f42c1; border-bottom: 2px solid #6f42c1; padding-bottom: 5px; margin-bottom: 15px;">Treatment Schedule</h3>
  <div style="padding: 20px; border: 2px solid #6f42c1; border-radius: 8px; background-color: #f8f5ff;">
    <p style="line-height: 1.6; margin: 0; color: #6f42c1; font-weight: 500;">
      Treatment will begin on <strong>{{appointment_date}}</strong> and may require multiple visits as outlined above. Our team will work with you to schedule follow-up appointments as needed.
    </p>
  </div>
</div>`
  }
};

const RichTextBuilderPage = () => {
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");
  const [content, setContent] = useState("");
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [newVariableType, setNewVariableType] = useState<'text' | 'textarea' | 'signature' | 'date'>('text');
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [variables, setVariables] = useState<VariableType[]>([
    { name: "patient_name", type: "text" },
    { name: "patient_id", type: "text" }, 
    { name: "dentist_name", type: "text" },
    { name: "appointment_date", type: "date" },
    { name: "treatment_type", type: "textarea" },
    { name: "patient_signature", type: "signature" },
    { name: "doctor_signature", type: "signature" },
    { name: "phone_number", type: "text" },
    { name: "email_address", type: "text" },
    { name: "date_of_birth", type: "date" }
  ]);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('richTextBuilderData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setSelectedFormat(data.selectedFormat || "A4");
        setContent(data.content || "");
        setVariables(data.variables || [
          { name: "patient_name", type: "text" },
          { name: "patient_id", type: "text" }, 
          { name: "dentist_name", type: "text" },
          { name: "appointment_date", type: "date" },
          { name: "treatment_type", type: "textarea" },
          { name: "patient_signature", type: "signature" },
          { name: "doctor_signature", type: "signature" },
          { name: "phone_number", type: "text" },
          { name: "email_address", type: "text" },
          { name: "date_of_birth", type: "date" }
        ]);
      } catch (error) {
        console.error('Error parsing stored rich text builder data:', error);
        navigate('/');
      }
    } else {
      // No data found, redirect to start
      navigate('/');
    }
  }, [navigate]);

  const updateStoredData = (newContent: string, newVariables: VariableType[]) => {
    sessionStorage.setItem('richTextBuilderData', JSON.stringify({
      selectedFormat,
      content: newContent,
      variables: newVariables
    }));
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateStoredData(newContent, variables);
  };

  const handleVariablesChange = (newVariables: VariableType[]) => {
    setVariables(newVariables);
    updateStoredData(content, newVariables);
  };

  const handleDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const addNewVariable = () => {
    if (newVariable.trim() && !variables.some(v => v.name === newVariable.trim())) {
      const updated = [...variables, { name: newVariable.trim(), type: newVariableType }];
      setVariables(updated);
      updateStoredData(content, updated);
      setNewVariable("");
      setNewVariableType('text');
      setShowVariableModal(false);
    }
  };

  const removeVariable = (variableName: string) => {
    const updated = variables.filter(v => v.name !== variableName);
    setVariables(updated);
    updateStoredData(content, updated);
  };

  const loadTemplate = (templateKey: string) => {
    const template = DENTAL_TEMPLATES[templateKey as keyof typeof DENTAL_TEMPLATES];
    if (template) {
      setContent(template.content);
      setVariables(template.variables);
      updateStoredData(template.content, template.variables);
      toast(`${template.name} template loaded!`);
    }
  };

  const getPageDimensions = (format: PDFFormat) => {
    switch (format) {
      case "A4":
        return { width: 595, height: 842 }; // A4 in points
      case "A5":
        return { width: 420, height: 595 }; // A5 in points
      case "Letter":
        return { width: 612, height: 792 }; // Letter in points
      default:
        return { width: 595, height: 842 };
    }
  };

  const handleContinue = async () => {
    // Create PDF builder data with rich text as background
    const newPage = {
      id: `page-${Date.now()}`,
      format: selectedFormat,
      elements: [],
      richTextContent: content,
      richTextVariables: variables
    };
    
    // Store using ApiService for consistency with completion component
    const { ApiService } = await import('@/services/apiService');
    await ApiService.savePDFBuilderData([newPage], selectedFormat);
    
    // Also store rich text specific data
    sessionStorage.setItem('richTextBuilderData', JSON.stringify({
      selectedFormat,
      content,
      variables,
      isRichTextDocument: true
    }));
    
    toast("Document ready for form completion!");
    navigate('/rich-text-completion');
  };

  const scale = 0.75;
  const pageDimensions = getPageDimensions(selectedFormat);
  const displayWidth = pageDimensions.width * scale;
  const displayHeight = pageDimensions.height * scale;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Dental Document Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Create patient documents and forms • {selectedFormat} format
            </p>
          </div>
          <Button 
            onClick={handleContinue}
            className="bg-green-600 hover:bg-green-700"
          >
            Continue to Form Completion
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Template Section */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quick Templates
              </h2>
              <div className="grid gap-2">
                {Object.entries(DENTAL_TEMPLATES).map(([key, template]) => {
                  const Icon = template.icon;
                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate(key)}
                      className="justify-start h-auto p-3"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="text-sm font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.variables.length} variables</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Variables Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Variable className="h-4 w-4" />
                  Variables
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowVariableModal(true)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Drag variables into your document or type {'{'}{'{'} variable_name {'}}'}
              </p>
            
              <div className="space-y-1">
                {variables.map((variable) => (
                  <div 
                    key={variable.name}
                    className="group flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <Badge
                      variant="secondary"
                      draggable
                      onDragStart={(e) => handleDragStart(e, variable.name)}
                      className="cursor-grab active:cursor-grabbing flex-1 justify-center font-mono text-xs"
                    >
                      {variable.name}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0"
                    >
                      {variable.type}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVariable(variable.name)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <RichTextEditor
                value={content}
                onChange={handleContentChange}
                className="h-full"
              />
            </div>
            
            {/* Preview */}
            <div className="h-1/2 border-t border-border overflow-auto bg-muted/30 p-6">
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium text-foreground">Document Preview</h3>
                <p className="text-xs text-muted-foreground">{selectedFormat} format</p>
              </div>
              
              <div className="flex justify-center">
                <Card 
                  className="shadow-lg bg-white"
                  style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <div 
                    className="p-8 text-sm overflow-auto h-full relative"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Variable Modal */}
      <Dialog open={showVariableModal} onOpenChange={setShowVariableModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Variable</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Variable Name</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Use snake_case format (e.g., patient_name, appointment_date)
              </p>
              <Input
                placeholder="e.g., patient_name"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNewVariable()}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Variable Type</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Choose the input type for this variable
              </p>
              <Select value={newVariableType} onValueChange={(value: any) => setNewVariableType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="textarea">Textarea (Multi-line)</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                  <SelectItem value="signature">Signature Canvas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={addNewVariable} disabled={!newVariable.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextBuilderPage;