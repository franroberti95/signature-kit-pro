import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Type, 
  PenTool, 
  Calendar, 
  CheckSquare, 
  ChevronDown, 
  Image,
  MousePointer,
  Grip
} from "lucide-react";
import { ElementType } from "./PDFBuilder";

interface ToolbarPanelProps {
  onAddElement: (type: ElementType) => void;
}

const toolbarElements = [
  {
    type: "text" as ElementType,
    icon: Type,
    label: "Text Field",
    description: "Single line text input",
  },
  {
    type: "signature" as ElementType,
    icon: PenTool,
    label: "Signature",
    description: "Digital signature field",
  },
  {
    type: "date" as ElementType,
    icon: Calendar,
    label: "Date",
    description: "Date picker field",
  },
  {
    type: "checkbox" as ElementType,
    icon: CheckSquare,
    label: "Checkbox",
    description: "Yes/No checkbox",
  },
  {
    type: "select" as ElementType,
    icon: ChevronDown,
    label: "Dropdown",
    description: "Multiple choice selection",
  },
  {
    type: "image" as ElementType,
    icon: Image,
    label: "Image",
    description: "Image upload field",
  },
];

export const ToolbarPanel = ({ onAddElement }: ToolbarPanelProps) => {
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, elementType: ElementType) => {
    e.dataTransfer.setData("text/plain", elementType);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-80 bg-toolbar-bg border-r border-toolbar-border overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Selection Tool */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="toolbar-active" size="toolbar" className="w-full">
              <MousePointer className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Grip className="w-4 h-4" />
              Form Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {toolbarElements.map((element) => {
                const IconComponent = element.icon;
                return (
                  <Button
                    key={element.type}
                    variant="toolbar"
                    size="toolbar"
                    draggable
                    onDragStart={(e) => handleDragStart(e, element.type)}
                    onClick={() => onAddElement(element.type)}
                    className="relative group"
                    title={element.description}
                  >
                    <IconComponent className="w-5 h-5" />
                    
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {element.label}
                    </div>
                  </Button>
                );
              })}
            </div>
            
            {/* Element descriptions */}
            <div className="mt-4 space-y-2">
              {toolbarElements.map((element) => (
                <div key={`desc-${element.type}`} className="text-xs text-muted-foreground">
                  <span className="font-medium">{element.label}:</span> {element.description}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-sm bg-accent/50">
          <CardContent className="pt-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-accent-foreground">How to use:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click elements to add them to the canvas</li>
                <li>Drag elements from toolbar to canvas</li>
                <li>Click and drag elements to reposition</li>
                <li>Click elements to configure properties</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};