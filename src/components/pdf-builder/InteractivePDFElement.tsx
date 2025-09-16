import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SignatureCanvas } from "./SignatureCanvas";
import { PDFElement } from "./PDFBuilder";
import { 
  Type, 
  PenTool, 
  Calendar, 
  CheckSquare, 
  ChevronDown, 
  Image,
  Upload,
  Edit3
} from "lucide-react";

interface InteractivePDFElementProps {
  element: PDFElement;
  scale: number;
  value: string | boolean;
  onUpdate: (value: string | boolean) => void;
  isActive?: boolean;
  onActivate?: () => void;
  hideOverlay?: boolean; // Hide visual boxes for export
}

const elementIcons: Record<string, any> = {
  text: Type,
  signature: PenTool,
  date: Calendar,
  checkbox: CheckSquare,
  select: ChevronDown,
  image: Image,
};

export const InteractivePDFElement = ({
  element,
  scale,
  value,
  onUpdate,
  isActive = false,
  onActivate,
  hideOverlay = false
}: InteractivePDFElementProps) => {
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const IconComponent = elementIcons[element.type];

  const handleClick = () => {
    onActivate?.();
    
    if (element.type === 'signature') {
      setShowSignatureCanvas(true);
    } else if (element.type === 'text') {
      setShowInput(true);
    } else if (element.type === 'image') {
      fileInputRef.current?.click();
    }
  };

  const handleSignatureComplete = (dataURL: string) => {
    onUpdate(dataURL);
    setShowSignatureCanvas(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onUpdate(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextSubmit = (newValue: string) => {
    onUpdate(newValue);
    setShowInput(false);
  };

  const renderElementContent = () => {
    const hasValue = value !== "" && value !== false && value !== null && value !== undefined;
    
    // For export mode, only show content without visual boxes
    if (hideOverlay && hasValue) {
      switch (element.type) {
        case "text":
          return (
            <div className="w-full h-full flex items-center justify-start text-sm font-medium text-black px-1">
              {String(value)}
            </div>
          );
        case "signature":
          return (
            <img 
              src={String(value)} 
              alt="Signature" 
              className="w-full h-full object-contain"
            />
          );
        case "image":
          return (
            <img 
              src={String(value)} 
              alt="Uploaded" 
              className="w-full h-full object-contain"
            />
          );
        case "checkbox":
          return (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-4 h-4 border-2 border-black ${Boolean(value) ? 'bg-black' : 'bg-white'} flex items-center justify-center`}>
                {Boolean(value) && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
          );
        case "date":
          return (
            <div className="w-full h-full flex items-center justify-start text-sm font-medium text-black px-1">
              {String(value)}
            </div>
          );
        default:
          return <div className="w-full h-full">{String(value)}</div>;
      }
    }
    
    // Interactive mode with visual boxes
    const baseClasses = `w-full h-full flex items-center justify-center text-xs font-medium rounded cursor-pointer transition-all duration-200 ${
      hasValue 
        ? 'bg-green-50 border-2 border-green-200 text-green-800' 
        : isActive
          ? 'bg-primary/10 border-2 border-primary border-dashed'
          : 'bg-white/90 border-2 border-dashed border-muted-foreground/40 hover:border-primary/60 hover:bg-primary/5'
    }`;
    
    switch (element.type) {
      case "text":
        return (
          <div className={baseClasses} onClick={handleClick}>
            {hasValue ? (
              <span className="px-2 py-1 text-xs truncate max-w-full">
                {String(value)}
              </span>
            ) : (
              <>
                <Type className="w-3 h-3 mr-1" />
                Click to type
              </>
            )}
          </div>
        );
        
      case "signature":
        return (
          <div className={baseClasses} onClick={handleClick}>
            {hasValue ? (
              <img 
                src={String(value)} 
                alt="Signature" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <>
                <PenTool className="w-3 h-3 mr-1" />
                Click to sign
              </>
            )}
          </div>
        );
        
      case "date":
        return (
          <div className={baseClasses}>
            {hasValue ? (
              <span className="text-xs">{String(value)}</span>
            ) : (
              <>
                <Calendar className="w-3 h-3 mr-1" />
                Select date
              </>
            )}
            <Input
              type="date"
              value={String(value) || ''}
              onChange={(e) => onUpdate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        );
        
      case "checkbox":
        return (
          <div 
            className={`${baseClasses} w-5 h-5 min-w-5 min-h-5`}
            onClick={() => onUpdate(!value)}
          >
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={() => {}}
              className="w-4 h-4"
            />
          </div>
        );
        
      case "image":
        return (
          <div className={baseClasses} onClick={handleClick}>
            {hasValue ? (
              <img 
                src={String(value)} 
                alt="Uploaded" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                Upload image
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        );
        
      default:
        return (
          <div className={baseClasses} onClick={handleClick}>
            <span className="text-xs">Click to fill</span>
          </div>
        );
    }
  };

  return (
    <>
      <div
        className={hideOverlay ? "absolute" : "absolute z-10"}
        style={{
          position: 'absolute',
          left: `${element.x * scale}px`,
          top: `${element.y * scale}px`,
          width: `${element.width * scale}px`,
          height: `${element.height * scale}px`,
          transform: 'translate3d(0, 0, 0)', // Force hardware acceleration for better positioning
        }}
        onClick={handleClick}
      >
        {renderElementContent()}
      </div>

      {/* Signature Canvas Modal */}
      {showSignatureCanvas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <SignatureCanvas
              width={350}
              height={180}
              onSignatureComplete={handleSignatureComplete}
              onCancel={() => setShowSignatureCanvas(false)}
            />
          </div>
        </div>
      )}

      {/* Text Input Modal */}
      {showInput && element.type === 'text' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Enter Text</h3>
            {element.placeholder === 'multiline' ? (
              <Textarea
                autoFocus
                value={String(value) || ''}
                onChange={(e) => onUpdate(e.target.value)}
                placeholder="Enter your text..."
                className="w-full mb-4 min-h-[100px]"
              />
            ) : (
              <Input
                autoFocus
                value={String(value) || ''}
                onChange={(e) => onUpdate(e.target.value)}
                placeholder="Enter your text..."
                className="w-full mb-4"
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInput(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleTextSubmit(String(value))}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};