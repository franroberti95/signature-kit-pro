import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
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
  style?: React.CSSProperties;
  variables?: string[];
  onVariablesChange?: (variables: string[]) => void;
}

export interface RichTextEditorRef {
  getEditor: () => ReactQuill.UnprivilegedEditor | null;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ 
  value = "", 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  style,
  variables = [],
  onVariablesChange
}, ref) => {
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [currentVariables, setCurrentVariables] = useState<string[]>(variables);
  const quillRef = useRef<ReactQuill>(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor() || null
  }));

  useEffect(() => {
    setCurrentVariables(variables);
  }, [variables]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  const formats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script', 'list', 'bullet', 'indent',
    'direction', 'align', 'link', 'image', 'video', 'blockquote', 'code-block'
  ];

  const handleDrop = (e: React.DragEvent) => {
    const variableData = e.dataTransfer.getData('text/plain');
    console.log('RichTextEditor drop:', variableData);
    
    try {
      // Try to parse as JSON first (for signature objects)
      const parsedData = JSON.parse(variableData);
      if (parsedData.type === 'signature') {
        // Don't handle signature drops here - let the parent handle them
        console.log('RichTextEditor: Signature drop detected, not handling');
        return; // Don't prevent default, let it bubble up
      }
    } catch {
      // If not JSON, treat as simple variable name
      if (variableData && currentVariables.includes(variableData)) {
        e.preventDefault();
        e.stopPropagation();
        insertVariable(variableData);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Always prevent default to allow drop, but let signatures bubble up
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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

  const insertSignatureField = (signatureName: string) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const range = editor.getSelection();
      if (range) {
        // Insert signature as a styled block
        const signatureHtml = `
          <div style="
            border: 2px dashed #8B5CF6; 
            padding: 20px; 
            margin: 10px 0; 
            background: #F3F4F6; 
            border-radius: 8px; 
            text-align: center;
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6B7280;
            font-style: italic;
          ">
            📝 ${signatureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {{${signatureName}}}
          </div>
        `;
        editor.clipboard.dangerouslyPasteHTML(range.index, signatureHtml);
      }
    }
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
      <div className={`relative ${className}`} style={style}>
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
            className="h-full w-full"
            style={{ height: '100%' }}
          />
        </div>
        
      </div>

    </>
  );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
