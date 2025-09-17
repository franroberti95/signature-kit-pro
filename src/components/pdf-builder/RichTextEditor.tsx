import { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variables?: string[];
}

const RichTextEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  variables = []
}: RichTextEditorProps) => {
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [currentVariables, setCurrentVariables] = useState<string[]>(variables);
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean'],
      ['variable'] // Custom button for variables
    ]
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align', 'link'
  ];

  useEffect(() => {
    // Add custom variable button to toolbar
    const toolbar = quillRef.current?.getEditor().getModule('toolbar');
    if (toolbar) {
      const variableButton = toolbar.container.querySelector('.ql-variable');
      if (variableButton) {
        variableButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
        variableButton.setAttribute('title', 'Insert Variable');
        variableButton.onclick = () => setShowVariableModal(true);
      }
    }
  }, []);

  const insertVariable = (variable: string) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const range = editor.getSelection();
      if (range) {
        editor.insertText(range.index, `{{${variable}}}`, 'user');
        editor.setSelection(range.index + variable.length + 4, 0);
      }
    }
    setShowVariableModal(false);
  };

  const addNewVariable = () => {
    if (newVariable.trim() && !currentVariables.includes(newVariable.trim())) {
      const updated = [...currentVariables, newVariable.trim()];
      setCurrentVariables(updated);
      insertVariable(newVariable.trim());
      setNewVariable("");
    }
  };

  const removeVariable = (variable: string) => {
    setCurrentVariables(prev => prev.filter(v => v !== variable));
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          className="bg-background"
        />
        
        {/* Variable Tags */}
        {currentVariables.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <Label className="text-xs text-muted-foreground mr-2">Variables:</Label>
            {currentVariables.map((variable) => (
              <Badge 
                key={variable} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => insertVariable(variable)}
              >
                {variable}
                <X 
                  className="ml-1 h-3 w-3" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVariable(variable);
                  }}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Variable Modal */}
      <Dialog open={showVariableModal} onOpenChange={setShowVariableModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Variable</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Existing Variables */}
            {currentVariables.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Existing Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentVariables.map((variable) => (
                    <Badge 
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => insertVariable(variable)}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add New Variable */}
            <div>
              <Label className="text-sm font-medium">Create New Variable</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter variable name..."
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
    </>
  );
};

export default RichTextEditor;
