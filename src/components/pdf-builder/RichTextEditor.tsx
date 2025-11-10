import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, User, Calendar, PenTool } from "lucide-react";
import { COMMON_VARIABLES } from "@/constants/variables";

// Custom Quill embed for variables to make them atomic
const Embed = Quill.import('blots/embed');

class VariableEmbed extends Embed {
  static blotName = 'variable-embed';
  static tagName = 'span';
  static className = 'variable-embed';

  static create(value: { variableName: string; displayText: string; backgroundColor: string; textColor: string }) {
    const node = super.create(value);
    const { variableName, displayText, backgroundColor, textColor } = value;
    
    node.setAttribute('contenteditable', 'false');
    node.setAttribute('data-variable', variableName);
    node.style.cssText = `
      display: inline-block;
      padding: 4px 8px;
      margin: 0 2px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.4;
      white-space: nowrap;
      cursor: default;
      user-select: all;
      background: ${backgroundColor};
      color: ${textColor};
      vertical-align: baseline;
    `;
    node.textContent = displayText;
    
    return node;
  }

  static value(node: HTMLElement) {
    return {
      variableName: node.getAttribute('data-variable'),
      displayText: node.textContent,
      backgroundColor: node.style.background,
      textColor: node.style.color
    };
  }
}

Quill.register(VariableEmbed);

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  variables?: string[];
  onVariablesChange?: (variables: string[]) => void;
  readOnly?: boolean;
}

export interface RichTextEditorRef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEditor: () => any;
  insertVariable: (variable: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ 
  value = "", 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  style,
  variables = [],
  onVariablesChange,
  readOnly = false
}, ref) => {
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [currentVariables, setCurrentVariables] = useState<string[]>(variables);
  const quillRef = useRef<ReactQuill>(null);
  const prevVariablesRef = useRef<string>(JSON.stringify(variables));

  // Helper function to create styled variable HTML - using background colors and making it a proper block
  const createStyledVariable = (variableName: string) => {
    const variable = COMMON_VARIABLES.find(v => v.name === variableName);
    if (!variable) {
      // Fallback for unknown variables
      return `<span style="display: inline-block; padding: 4px 8px; margin: 0 2px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #f3f4f6; color: #374151; white-space: nowrap; cursor: default;" data-variable="${variableName}" contenteditable="false" class="variable-block">${variableName}</span>`;
    }

    const { type, label } = variable;
    let backgroundColor = '#dbeafe'; // light blue
    let textColor = '#1e40af';

    switch (type) {
      case 'text':
        backgroundColor = '#dbeafe'; // light blue
        textColor = '#1e40af';
        break;
      case 'date':
        backgroundColor = '#fed7aa'; // light orange
        textColor = '#b45309';
        break;
      case 'signature':
        backgroundColor = '#e9d5ff'; // light purple
        textColor = '#6d28d9';
        break;
      default:
        backgroundColor = '#f3f4f6'; // light gray
        textColor = '#374151';
    }

    return `<span style="display: inline-block; padding: 4px 8px; margin: 0 2px; border-radius: 4px; font-size: 12px; font-weight: 500; line-height: 1.4; white-space: nowrap; cursor: default; background: ${backgroundColor}; color: ${textColor};" data-variable="${variableName}" contenteditable="false" class="variable-block" title="${label || variableName}">${label || variableName}</span>`;
  };

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor() || null,
    insertVariable: (variable: string) => {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection();
        if (range) {
          // Find variable data for proper styling
          const variable_data = COMMON_VARIABLES.find(v => v.name === variable);
          const displayText = variable_data?.label || variable;
          
          // Apply background color based on type
          let backgroundColor = '#dbeafe'; // light blue
          let textColor = '#1e40af';
          if (variable_data?.type === 'date') {
            backgroundColor = '#fed7aa'; // light orange
            textColor = '#b45309';
          }
          if (variable_data?.type === 'signature') {
            backgroundColor = '#e9d5ff'; // light purple
            textColor = '#6d28d9';
          }
          
          // Insert as atomic embed
          editor.insertEmbed(range.index, 'variable-embed', {
            variableName: variable,
            displayText: displayText,
            backgroundColor: backgroundColor,
            textColor: textColor
          });
          
          // Move cursor after the embed and add space
          editor.setSelection(range.index + 1, 0);
          editor.insertText(range.index + 1, ' ');
          editor.setSelection(range.index + 2, 0);
        }
      }
    }
  }));

  useEffect(() => {
    // Only update if variables actually changed (use ref to track previous value to avoid infinite loops)
    const currentStr = JSON.stringify([...variables].sort());
    if (prevVariablesRef.current !== currentStr) {
      prevVariablesRef.current = currentStr;
      setCurrentVariables(variables);
    }
  }, [variables]);


  const modules = readOnly ? { toolbar: false } : {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['blockquote'],
      ['clean']
    ]
  };

  const formats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'direction', 'align', 'link', 'image', 'blockquote', 'variable', 'variable-embed'
  ];

  const handleDrop = (e: React.DragEvent) => {
    const variableData = e.dataTransfer.getData('text/plain');
    
    try {
      // Try to parse as JSON first (for signature objects)
      const parsedData = JSON.parse(variableData);
      if (parsedData.type === 'signature') {
        // Don't handle signature drops here - let the parent handle them
        return; // Don't prevent default, let it bubble up
      }
    } catch {
      // If not JSON, treat as variable (either "name" or "{{name}}" format)
      let variableName = variableData;
      
      // Extract variable name from {{variable}} format
      if (variableData && variableData.startsWith('{{') && variableData.endsWith('}}')) {
        variableName = variableData.slice(2, -2);
      }
      
      if (variableName && (currentVariables.includes(variableName) || COMMON_VARIABLES.some(v => v.name === variableName))) {
        e.preventDefault();
        e.stopPropagation();
        
        // Insert styled variable at drop position - use embed approach
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const selection = editor.getSelection();
          if (selection) {
            const variable_data = COMMON_VARIABLES.find(v => v.name === variableName);
            const displayText = variable_data?.label || variableName;
            
            // Apply background color based on type
            let backgroundColor = '#dbeafe'; // light blue
            let textColor = '#1e40af';
            if (variable_data?.type === 'date') {
              backgroundColor = '#fed7aa'; // light orange
              textColor = '#b45309';
            }
            if (variable_data?.type === 'signature') {
              backgroundColor = '#e9d5ff'; // light purple
              textColor = '#6d28d9';
            }
            
            // Insert as atomic embed
            editor.insertEmbed(selection.index, 'variable-embed', {
              variableName: variableName,
              displayText: displayText,
              backgroundColor: backgroundColor,
              textColor: textColor
            });
            
            // Move cursor after the embed and add space
            editor.setSelection(selection.index + 1, 0);
            editor.insertText(selection.index + 1, ' ');
            editor.setSelection(selection.index + 2, 0);
          }
        }
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
        const variable_data = COMMON_VARIABLES.find(v => v.name === variable);
        const displayText = variable_data?.label || variable;
        
        // Apply background color based on type
        let backgroundColor = '#dbeafe'; // light blue
        let textColor = '#1e40af';
        if (variable_data?.type === 'date') {
          backgroundColor = '#fed7aa'; // light orange
          textColor = '#b45309';
        }
        if (variable_data?.type === 'signature') {
          backgroundColor = '#e9d5ff'; // light purple
          textColor = '#6d28d9';
        }
        
        // Insert as atomic embed
        editor.insertEmbed(range.index, 'variable-embed', {
          variableName: variable,
          displayText: displayText,
          backgroundColor: backgroundColor,
          textColor: textColor
        });
        
        // Move cursor after the embed and add space
        editor.setSelection(range.index + 1, 0);
        editor.insertText(range.index + 1, ' ');
        editor.setSelection(range.index + 2, 0);
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
          className={readOnly ? "h-full" : ""}
        >
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                modules={modules}
                formats={formats}
                className={readOnly ? "h-full w-full" : "w-full"}
                style={readOnly ? { height: '100%' } : {}}
                readOnly={readOnly}
              />
        </div>
        
      </div>

    </>
  );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
