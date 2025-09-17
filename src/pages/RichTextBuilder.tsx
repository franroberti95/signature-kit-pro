import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/pdf-builder/RichTextEditor";
import { PDFFormat } from "@/components/pdf-builder/PDFBuilder";
import { toast } from "sonner";
import { Plus, X, Variable, FileText, Stethoscope, User, Calendar } from "lucide-react";

// Dental template definitions
const DENTAL_TEMPLATES = {
  consent: {
    name: "Treatment Consent Form",
    icon: Stethoscope,
    variables: ["patient_name", "patient_id", "treatment_type", "dentist_name", "appointment_date", "patient_signature", "doctor_signature"],
    content: `<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0066cc; padding-bottom: 15px;">
  <h1 style="color: #0066cc; font-size: 24px; margin: 0; font-weight: bold;">DENTAL TREATMENT CONSENT FORM</h1>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
  <div><strong>Patient Name:</strong> <span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 150px; display: inline-block;">{{patient_name}}</span></div>
  <div><strong>Patient ID:</strong> <span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 100px; display: inline-block;">{{patient_id}}</span></div>
  <div><strong>Date:</strong> <span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 120px; display: inline-block;">{{appointment_date}}</span></div>
  <div><strong>Doctor:</strong> <span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 150px; display: inline-block;">Dr. {{dentist_name}}</span></div>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 5px; margin-bottom: 15px;">Treatment Authorization</h3>
  <p style="line-height: 1.6; margin-bottom: 15px;">I hereby authorize Dr. {{dentist_name}} and the dental team to perform the following treatment:</p>
  <div style="padding: 15px; border: 2px solid #ddd; border-radius: 5px; background-color: #fff;">
    <strong>Treatment:</strong> <span style="color: #0066cc; font-weight: bold;">{{treatment_type}}</span>
  </div>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 5px; margin-bottom: 15px;">Patient Acknowledgment</h3>
  <p style="line-height: 1.6; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc; margin: 0;">
    I acknowledge that I have been informed of the treatment plan, risks, benefits, and alternatives. I understand that no guarantee has been made regarding the outcome of treatment.
  </p>
</div>

<div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
  <div style="text-align: center; padding: 20px; border: 2px solid #ddd; border-radius: 8px;">
    <div style="border-bottom: 2px solid #333; margin-bottom: 8px; height: 40px; display: flex; align-items: end; justify-content: center;">
      <span style="color: #0066cc; font-weight: bold;">{{patient_signature}}</span>
    </div>
    <div><strong>Patient Signature</strong></div>
    <div style="margin-top: 15px;">
      <span>Date: </span><span style="border-bottom: 1px solid #666; padding-bottom: 2px; min-width: 100px; display: inline-block;">{{appointment_date}}</span>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; border: 2px solid #ddd; border-radius: 8px;">
    <div style="border-bottom: 2px solid #333; margin-bottom: 8px; height: 40px; display: flex; align-items: end; justify-content: center;">
      <span style="color: #0066cc; font-weight: bold;">{{doctor_signature}}</span>
    </div>
    <div><strong>Doctor Signature</strong></div>
    <div style="margin-top: 15px;">
      <span>Date: </span><span style="border-bottom: 1px solid #666; padding-bottom: 2px; min-width: 100px; display: inline-block;">{{appointment_date}}</span>
    </div>
  </div>
</div>`
  },
  history: {
    name: "Medical History Form",
    icon: User,
    variables: ["patient_name", "patient_id", "date_of_birth", "phone_number", "email_address", "emergency_contact", "medical_conditions", "medications", "allergies"],
    content: `<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #28a745; padding-bottom: 15px;">
  <h1 style="color: #28a745; font-size: 24px; margin: 0; font-weight: bold;">DENTAL MEDICAL HISTORY</h1>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 5px; margin-bottom: 15px;">Patient Information</h3>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
    <div><strong>Patient Name:</strong><br><span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 200px; display: inline-block; margin-top: 5px;">{{patient_name}}</span></div>
    <div><strong>Patient ID:</strong><br><span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 150px; display: inline-block; margin-top: 5px;">{{patient_id}}</span></div>
    <div><strong>Date of Birth:</strong><br><span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 150px; display: inline-block; margin-top: 5px;">{{date_of_birth}}</span></div>
    <div><strong>Phone:</strong><br><span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 150px; display: inline-block; margin-top: 5px;">{{phone_number}}</span></div>
  </div>
  <div style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
    <div><strong>Email Address:</strong><br><span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 300px; display: inline-block; margin-top: 5px;">{{email_address}}</span></div>
  </div>
</div>

<div style="margin-bottom: 25px;">
  <h3 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 5px; margin-bottom: 15px;">Emergency Contact</h3>
  <div style="padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 0 8px 8px 0;">
    <strong>Emergency Contact Information:</strong><br>
    <span style="border-bottom: 2px dotted #666; padding-bottom: 2px; min-width: 400px; display: inline-block; margin-top: 8px;">{{emergency_contact}}</span>
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
    variables: ["patient_name", "patient_id", "dentist_name", "treatment_description", "estimated_cost", "treatment_duration", "appointment_date"],
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [variables, setVariables] = useState<string[]>([
    "patient_name",
    "patient_id", 
    "dentist_name",
    "appointment_date",
    "treatment_type",
    "patient_signature",
    "doctor_signature",
    "phone_number",
    "email_address",
    "date_of_birth"
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
          "patient_name",
          "patient_id", 
          "dentist_name",
          "appointment_date",
          "treatment_type",
          "patient_signature",
          "doctor_signature",
          "phone_number",
          "email_address",
          "date_of_birth"
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

  const updateStoredData = (newContent: string, newVariables: string[]) => {
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

  const handleVariablesChange = (newVariables: string[]) => {
    setVariables(newVariables);
    updateStoredData(content, newVariables);
  };

  const handleDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const addNewVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      const updated = [...variables, newVariable.trim()];
      setVariables(updated);
      updateStoredData(content, updated);
      setNewVariable("");
      setShowVariableModal(false);
    }
  };

  const removeVariable = (variable: string) => {
    const updated = variables.filter(v => v !== variable);
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

  const handleContinue = () => {
    // Create PDF builder data with rich text as background
    const newPage = {
      id: `page-${Date.now()}`,
      format: selectedFormat,
      elements: [],
      richTextContent: content,
      richTextVariables: variables
    };
    
    sessionStorage.setItem('pdfBuilderData', JSON.stringify({
      pages: [newPage],
      selectedFormat,
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
                    key={variable}
                    className="group flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <Badge
                      variant="secondary"
                      draggable
                      onDragStart={(e) => handleDragStart(e, variable)}
                      className="cursor-grab active:cursor-grabbing flex-1 justify-center font-mono text-xs"
                    >
                      {variable}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVariable(variable)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            
              {variables.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No variables yet. Add one to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-surface">
          <div className="flex flex-col items-center">
            {/* Page Container */}
            <div className="relative">
              <div className="absolute -top-6 left-0 text-sm text-muted-foreground">
                Page 1
              </div>
              
              {/* PDF Page with Rich Text Editor */}
              <div 
                className="relative bg-white shadow-lg rounded-lg overflow-hidden border border-pdf-border"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                }}
              >
                <div className="absolute inset-4 z-10">
                  <RichTextEditor
                    value={content}
                    onChange={handleContentChange}
                    variables={variables}
                    onVariablesChange={handleVariablesChange}
                    placeholder="Start typing your document content... Use {{variable_name}} syntax to insert variables, or drag them from the sidebar."
                    className="h-full"
                  />
                </div>
                
                {/* Grid pattern for alignment */}
                <div 
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * scale}px ${20 * scale}px`,
                  }}
                />
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
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., patient_name"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewVariable()}
                />
                <Button onClick={addNewVariable} disabled={!newVariable.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextBuilderPage;