import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Type, 
  PenTool, 
  Calendar, 
  CheckSquare, 
  ChevronDown, 
  Image,
  X,
  Settings,
  FileText
} from "lucide-react";
import { PDFElement, ElementType } from "./PDFBuilder";

interface PDFElementComponentProps {
  element: PDFElement;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (deltaX: number, deltaY: number) => void;
  onUpdate: (updates: Partial<PDFElement>) => void;
  onDelete: () => void;
}

const elementIcons: Record<ElementType, any> = {
  text: Type,
  signature: PenTool,
  date: Calendar,
  checkbox: CheckSquare,
  image: Image,
};

export const PDFElementComponent = ({
  element,
  scale,
  isSelected,
  onSelect,
  onDrag,
  onUpdate,
  onDelete
}: PDFElementComponentProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const IconComponent = elementIcons[element.type];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      
      onDrag(element.x * scale + deltaX, element.y * scale + deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStart.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderElementContent = () => {
    const baseClasses = "w-full h-full border-2 border-dashed border-muted-foreground/40 bg-white/80 flex items-center justify-center text-xs text-muted-foreground font-medium rounded";
    
    switch (element.type) {
      case "text":
        return (
          <div className={baseClasses}>
            <Type className="w-3 h-3 mr-1" />
            Text Field
          </div>
        );
      case "signature":
        return (
          <div className={`${baseClasses} bg-primary/10 border-primary/40`}>
            <PenTool className="w-3 h-3 mr-1" />
            Signature
          </div>
        );
      case "date":
        return (
          <div className={baseClasses}>
            <Calendar className="w-3 h-3 mr-1" />
            Date
          </div>
        );
      case "checkbox":
        return (
          <div className={`${baseClasses} w-5 h-5 min-w-5 min-h-5`}>
            <CheckSquare className="w-3 h-3" />
          </div>
        );
      case "image":
        return (
          <div className={baseClasses}>
            <Image className="w-3 h-3 mr-1" />
            Image Upload
          </div>
        );
      default:
        return (
          <div className={baseClasses}>
            Unknown
          </div>
        );
    }
  };

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move group transition-all duration-100 ${
        isSelected ? "z-10" : "z-0"
      } ${isDragging ? "opacity-80" : ""}`}
      style={{
        left: `${element.x * scale}px`,
        top: `${element.y * scale}px`,
        width: `${element.width * scale}px`,
        height: `${element.height * scale}px`,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Element Content */}
      {renderElementContent()}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary rounded pointer-events-none">
          {/* Resize handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
        </div>
      )}

      {/* Action Buttons */}
      {isSelected && (
        <div className="absolute -top-8 right-0 flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-2 py-1 shadow-md">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0 hover:bg-secondary-hover"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfig(!showConfig);
            }}
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && isSelected && (
        <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-3 min-w-48 z-20">
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-foreground">Placeholder</label>
              <Input
                value={element.placeholder || ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="text-xs h-7"
                placeholder="Enter placeholder text"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={element.required || false}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-3 h-3"
              />
              <label className="text-xs text-foreground">Required field</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};