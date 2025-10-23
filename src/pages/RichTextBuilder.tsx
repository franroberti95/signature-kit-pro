import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed dropdown imports - using simple buttons instead
import { toast } from "sonner";
import { 
  FileText, 
  Plus, 
  Variable, 
  X, 
  Stethoscope, 
  Heart, 
  Calendar, 
  Shield,
  PenTool,
  User,
  Mail,
  Phone,
  ChevronDown,
  Type,
  Save,
  ArrowLeft
} from "lucide-react";
import RichTextEditor, { RichTextEditorRef } from "@/components/pdf-builder/RichTextEditor";

type PDFFormat = "A4" | "A5" | "Letter";

interface VariableType {
  name: string;
  type: 'text' | 'textarea' | 'signature' | 'date';
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface InteractiveElement {
  id: string;
  type: 'signature';
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Common variables for medical/dental documents
const COMMON_VARIABLES: VariableType[] = [
  { name: "patient_name", type: "text", label: "Patient Name", icon: User },
  { name: "patient_surname", type: "text", label: "Patient Surname", icon: User },
  { name: "patient_id", type: "text", label: "Patient ID", icon: User },
  { name: "date_of_birth", type: "date", label: "Date of Birth", icon: Calendar },
  { name: "phone_number", type: "text", label: "Phone Number", icon: Phone },
  { name: "email_address", type: "text", label: "Email Address", icon: Mail },
  { name: "appointment_date", type: "date", label: "Appointment Date", icon: Calendar },
  { name: "doctor_name", type: "text", label: "Doctor Name", icon: Stethoscope },
  { name: "patient_signature", type: "signature", label: "Patient Signature", icon: PenTool },
  { name: "doctor_signature", type: "signature", label: "Doctor Signature", icon: PenTool },
  { name: "today_date", type: "date", label: "Today's Date", icon: Calendar },
];

// Interactive Signature Box Component
const InteractiveSignatureBox = ({ element, onUpdate, onDelete }: {
  element: InteractiveElement;
  onUpdate: (element: InteractiveElement) => void;
  onDelete: (id: string) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate({
          ...element,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, element, onUpdate]);

  return (
    <div
      className="absolute border-2 border-dashed border-purple-400 bg-purple-50 bg-opacity-90 pointer-events-auto cursor-move group hover:border-purple-500 transition-colors"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        minWidth: '120px',
        minHeight: '40px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.signature-content')) {
          setIsDragging(true);
          setDragStart({
            x: e.clientX - element.x,
            y: e.clientY - element.y,
          });
          e.preventDefault();
        }
      }}
    >
      <div className="signature-content p-2 text-center text-purple-700 text-sm font-medium flex items-center justify-center h-full">
        <PenTool className="h-4 w-4 mr-2" />
        {element.label}
      </div>
      
      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = element.width;
          const startHeight = element.height;

          const handleResize = (e: MouseEvent) => {
            const newWidth = Math.max(120, startWidth + (e.clientX - startX));
            const newHeight = Math.max(40, startHeight + (e.clientY - startY));
            
            onUpdate({
              ...element,
              width: newWidth,
              height: newHeight,
            });
          };

          const handleResizeEnd = () => {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', handleResizeEnd);
          };

          document.addEventListener('mousemove', handleResize);
          document.addEventListener('mouseup', handleResizeEnd);
        }}
      />
      
      {/* Delete button */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
        onClick={() => onDelete(element.id)}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const RichTextBuilderPage = () => {
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<PDFFormat>("A4");
  const [content, setContent] = useState("");
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [newVariableType, setNewVariableType] = useState<'text' | 'textarea' | 'signature' | 'date'>('text');
  const [variables, setVariables] = useState<VariableType[]>(COMMON_VARIABLES);
  const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
  const editorRef = useRef<RichTextEditorRef>(null);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('richTextBuilderData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setSelectedFormat(data.selectedFormat || "A4");
        setContent(data.content || "");
        setVariables(data.variables || COMMON_VARIABLES);
      } catch (error) {
        console.error('Error parsing stored rich text builder data:', error);
        navigate('/');
      }
    } else {
      // No data found, redirect to start
      navigate('/');
    }
  }, [navigate]);

  const updateStoredData = (newContent?: string, newVariables?: VariableType[]) => {
    sessionStorage.setItem('richTextBuilderData', JSON.stringify({
      selectedFormat,
      content: newContent || content,
      variables: newVariables || variables
    }));
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateStoredData(newContent, variables);
  };

  const insertVariable = (variable: VariableType) => {
    const variableText = `{{${variable.name}}}`;
    
    // Simple insertion at the end of content
    const newContent = content + (content ? ' ' : '') + variableText;
    setContent(newContent);
    updateStoredData(newContent, variables);
    toast(`Inserted ${variable.label || variable.name}`);
  };

  const addNewVariable = () => {
    if (newVariable.trim() && !variables.some(v => v.name === newVariable.trim())) {
      const updated = [...variables, { 
        name: newVariable.trim(), 
        type: newVariableType,
        label: newVariable.trim().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }];
      setVariables(updated);
      updateStoredData(content, updated);
      setNewVariable("");
      setNewVariableType('text');
      setShowVariableModal(false);
      toast("Variable added successfully!");
    }
  };

  const removeVariable = (variableName: string) => {
    const updated = variables.filter(v => v.name !== variableName);
    setVariables(updated);
    updateStoredData(content, updated);
    toast("Variable removed");
  };

  const handleContinue = async () => {
    if (!content.trim()) {
      toast("Please add some content to your document first.");
      return;
    }

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

  const handleSave = () => {
    updateStoredData();
    toast("Document saved!");
  };

  const addInteractiveElement = (signatureData: { type: string; name: string; label?: string }, x: number, y: number) => {
    const newElement: InteractiveElement = {
      id: `signature-${Date.now()}`,
      type: 'signature',
      name: signatureData.name,
      label: signatureData.label || signatureData.name,
      x: x - 100, // Center the element
      y: y - 25,
      width: 200,
      height: 50,
    };
    
    setInteractiveElements(prev => [...prev, newElement]);
    toast(`Added ${newElement.label} signature box`);
  };

  const updateInteractiveElement = (updatedElement: InteractiveElement) => {
    setInteractiveElements(prev => 
      prev.map(el => el.id === updatedElement.id ? updatedElement : el)
    );
  };

  const deleteInteractiveElement = (elementId: string) => {
    setInteractiveElements(prev => prev.filter(el => el.id !== elementId));
    toast("Signature box deleted");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Editor
              </h1>
              <p className="text-sm text-muted-foreground">
                Create professional documents with variables • {selectedFormat} format
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button 
              onClick={handleContinue}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              Continue to Completion
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-muted-foreground">Quick Insert:</span>
            
            {/* Patient Name */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                const patientName = variables.find(v => v.name === 'patient_name');
                if (patientName) {
                  insertVariable(patientName);
                } else {
                  toast("Patient name variable not found");
                }
              }}
            >
              <User className="h-4 w-4" />
              Name
            </Button>

            {/* Today's Date */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                const todayDate = variables.find(v => v.name === 'today_date');
                if (todayDate) {
                  insertVariable(todayDate);
                } else {
                  toast("Today's date variable not found");
                }
              }}
            >
              <Calendar className="h-4 w-4" />
              Date
            </Button>

            {/* Add Custom Variable */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowVariableModal(true)}
            >
              <Plus className="h-4 w-4" />
              Add Variable
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with draggable elements */}
        <div className="w-64 border-r border-border bg-card overflow-y-auto">
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Drag & Drop Elements</h3>
            
            {/* Signature Boxes */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signatures</h4>
              {variables.filter(v => v.type === 'signature').map((variable) => (
                <div
                  key={variable.name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                      type: 'signature',
                      name: variable.name,
                      label: variable.label
                    }));
                  }}
                  className="p-3 border-2 border-dashed border-purple-300 bg-purple-50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-purple-700">
                    <PenTool className="h-4 w-4" />
                    <span className="text-sm font-medium">{variable.label || variable.name}</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Drag into document</p>
                </div>
              ))}
            </div>

            {/* Text Fields */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Text Fields</h4>
              {variables.filter(v => v.type === 'text').map((variable) => (
                <div
                  key={variable.name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', variable.name);
                  }}
                  className="p-2 border border-blue-300 bg-blue-50 rounded cursor-grab active:cursor-grabbing hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-blue-700">
                    <Type className="h-3 w-3" />
                    <span className="text-xs font-medium">{variable.label || variable.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Date Fields */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dates</h4>
              {variables.filter(v => v.type === 'date').map((variable) => (
                <div
                  key={variable.name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', variable.name);
                  }}
                  className="p-2 border border-orange-300 bg-orange-50 rounded cursor-grab active:cursor-grabbing hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-orange-700">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs font-medium">{variable.label || variable.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor with Interactive Overlay */}
        <div 
          className="flex-1 overflow-hidden relative"
          onDrop={(e) => {
            console.log('Container drop event:', e);
            const data = e.dataTransfer.getData('text/plain');
            console.log('Drop data:', data);
            try {
              const signatureData = JSON.parse(data);
              console.log('Parsed signature data:', signatureData);
              if (signatureData.type === 'signature') {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                addInteractiveElement(signatureData, e.clientX - rect.left, e.clientY - rect.top);
                console.log('Added signature element');
              }
            } catch (error) {
              console.log('Not signature data or parse error:', error);
              // Not signature data, let editor handle it normally
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
        >
          {/* Rich Text Editor Layer */}
          <div className="absolute inset-0 z-10">
            <RichTextEditor
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              className="h-full w-full"
              style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}
            />
          </div>

          {/* Interactive Elements Overlay - only for signature boxes */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {interactiveElements.map((element) => (
              <InteractiveSignatureBox
                key={element.id}
                element={element}
                onUpdate={(updatedElement) => updateInteractiveElement(updatedElement)}
                onDelete={(elementId) => deleteInteractiveElement(elementId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add Variable Modal */}
      <Dialog open={showVariableModal} onOpenChange={setShowVariableModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Custom Variable</DialogTitle>
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
              <Select value={newVariableType} onValueChange={(value: 'text' | 'textarea' | 'signature' | 'date') => setNewVariableType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
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