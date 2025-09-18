import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X,
  Settings
} from "lucide-react";
import { PDFElement, ElementType, PreDefinedFieldsConfig } from "./PDFBuilder";

interface PDFElementComponentProps {
  element: PDFElement;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (deltaX: number, deltaY: number) => void;
  onResize: (deltaX: number, deltaY: number, deltaWidth: number, deltaHeight: number) => void;
  onUpdate: (updates: Partial<PDFElement>) => void;
  onDelete: () => void;
  preDefinedFields?: PreDefinedFieldsConfig;
}

export const PDFElementComponent = ({
  element,
  scale,
  isSelected,
  onSelect,
  onDrag,
  onResize,
  onUpdate,
  onDelete,
  preDefinedFields
}: PDFElementComponentProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

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

  const handleResizeMouseDown = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setIsResizing(true);
    resizeStart.current = { 
      x: e.clientX, 
      y: e.clientY, 
      width: element.width * scale, 
      height: element.height * scale 
    };

    const handleResizeMove = (e: MouseEvent) => {
      if (!resizeStart.current) return;
      
      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;
      
      let newWidth = resizeStart.current.width;
      let newHeight = resizeStart.current.height;
      let newX = element.x * scale;
      let newY = element.y * scale;

      // Calculate new dimensions based on corner
      switch (corner) {
        case 'se': // bottom-right
          newWidth = Math.max(20 * scale, resizeStart.current.width + deltaX);
          newHeight = Math.max(15 * scale, resizeStart.current.height + deltaY);
          break;
        case 'sw': // bottom-left
          newWidth = Math.max(20 * scale, resizeStart.current.width - deltaX);
          newHeight = Math.max(15 * scale, resizeStart.current.height + deltaY);
          newX = element.x * scale + deltaX;
          break;
        case 'ne': // top-right
          newWidth = Math.max(20 * scale, resizeStart.current.width + deltaX);
          newHeight = Math.max(15 * scale, resizeStart.current.height - deltaY);
          newY = element.y * scale + deltaY;
          break;
        case 'nw': // top-left
          newWidth = Math.max(20 * scale, resizeStart.current.width - deltaX);
          newHeight = Math.max(15 * scale, resizeStart.current.height - deltaY);
          newX = element.x * scale + deltaX;
          newY = element.y * scale + deltaY;
          break;
      }

      onResize(newX, newY, newWidth, newHeight);
    };

    const handleResizeUp = () => {
      setIsResizing(false);
      resizeStart.current = null;
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeUp);
  };

  const renderElementContent = () => {
    // Calculate font size based on container height (like DocuSeal)
    const minFontSize = 8;
    const maxFontSize = 24;
    const calculatedFontSize = Math.max(minFontSize, Math.min(maxFontSize, (element.height * scale) * 0.8));
    
    const baseClasses = "w-full h-full border-2 border-dashed border-muted-foreground/40 bg-white/80 flex items-start justify-start text-muted-foreground font-medium p-0 leading-none";
    const fontSize = `${calculatedFontSize}px`;
    
    switch (element.type) {
      case "text":
        return (
          <div className={baseClasses} style={{ fontSize }}>
            {element.placeholder || "Text Field"}
          </div>
        );
      case "signature":
        return (
          <div className={`${baseClasses} bg-primary/10 border-primary/40`} style={{ fontSize }}>
            Signature
          </div>
        );
      case "date":
        return (
          <div className={baseClasses} style={{ fontSize }}>
            Date
          </div>
        );
      case "checkbox":
        return (
          <div className={`${baseClasses} w-5 h-5 min-w-5 min-h-5 justify-center`}>
            <div className="w-3 h-3 border border-muted-foreground"></div>
          </div>
        );
      case "image":
        return (
          <div className={baseClasses} style={{ fontSize }}>
            Image Upload
          </div>
        );
      default:
        return (
          <div className={baseClasses} style={{ fontSize }}>
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
      } ${isDragging || isResizing ? "opacity-80" : ""}`}
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
        <div className="absolute inset-0 border-2 border-primary pointer-events-none">
          {/* Resize handles */}
          <div 
            className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize pointer-events-auto hover:bg-primary/80"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          ></div>
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize pointer-events-auto hover:bg-primary/80"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          ></div>
          <div 
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize pointer-events-auto hover:bg-primary/80"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          ></div>
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize pointer-events-auto hover:bg-primary/80"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          ></div>
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
            
            {/* Pre-defined Values Section */}
            {((element.type === 'text' && preDefinedFields?.text_field_options) ||
              (element.type === 'signature' && preDefinedFields?.signature_field_options) ||
              (element.type === 'date' && preDefinedFields?.date_field_options)) && (
              <div>
                <label className="text-xs font-medium text-foreground">Pre-defined Value</label>
                <Select
                  value={element.preDefinedValueId?.toString() || ""}
                  onValueChange={(value) => {
                    if (value === "") {
                      onUpdate({ preDefinedValueId: undefined, preDefinedLabel: undefined });
                    } else {
                      let options;
                      if (element.type === 'text') options = preDefinedFields?.text_field_options;
                      else if (element.type === 'signature') options = preDefinedFields?.signature_field_options;
                      else if (element.type === 'date') options = preDefinedFields?.date_field_options;
                      
                      const selectedOption = options?.find(opt => opt.value.toString() === value);
                      onUpdate({ 
                        preDefinedValueId: selectedOption?.value, 
                        preDefinedLabel: selectedOption?.label 
                      });
                    }
                  }}
                >
                  <SelectTrigger 
                    className="text-xs h-7"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue placeholder="Select pre-defined value..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (manual input)</SelectItem>
                    {element.type === 'text' && preDefinedFields?.text_field_options?.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                    {element.type === 'signature' && preDefinedFields?.signature_field_options?.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                    {element.type === 'date' && preDefinedFields?.date_field_options?.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {element.preDefinedLabel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Will auto-fill: {element.preDefinedLabel}
                  </p>
                )}
              </div>
            )}
            
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