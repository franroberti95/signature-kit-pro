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
  onVariablesChange?: (variables: string[]) => void;
}

const RichTextEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  variables = [],
  onVariablesChange
}: RichTextEditorProps) => {
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [currentVariables, setCurrentVariables] = useState<string[]>(variables);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    setCurrentVariables(variables);
  }, [variables]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align', 'link'
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const variableName = e.dataTransfer.getData('text/plain');
    if (variableName && currentVariables.includes(variableName)) {
      insertVariable(variableName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

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
      onVariablesChange?.(updated);
      insertVariable(newVariable.trim());
      setNewVariable("");
    }
  };

  const removeVariable = (variable: string) => {
    const updated = currentVariables.filter(v => v !== variable);
    setCurrentVariables(updated);
    onVariablesChange?.(updated);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="h-full"
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            modules={modules}
            formats={formats}
            className="bg-background h-full"
          />
        </div>
        
      </div>

    </>
  );
};

export default RichTextEditor;
