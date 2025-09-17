import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Type, 
  PenTool, 
  Calendar, 
  CheckSquare, 
  ChevronDown, 
  Image,
  Grip,
  FileText
} from "lucide-react";
import { ElementType } from "./PDFBuilder";

interface ToolbarPanelProps {
  onAddElement: (type: ElementType) => void;
}

const toolbarElements = [
  {
    type: "richtext" as ElementType,
    icon: FileText,
    label: "Rich Text",
    description: "Word-like rich text editor with variables",
  },
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
        {/* Form Elements */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Grip className="w-4 h-4" />
              Form Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Form Elements Grid */}
            <div className="space-y-2">
              {toolbarElements.map((element) => {
                const IconComponent = element.icon;
                return (
                  <div 
                    key={element.type}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-toolbar-hover transition-colors cursor-pointer"
                    onClick={() => onAddElement(element.type)}
                  >
                    <Button
                      variant="toolbar"
                      size="toolbar"
                      draggable
                      onDragStart={(e) => handleDragStart(e, element.type)}
                      className="flex-shrink-0"
                    >
                      <IconComponent className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {element.label}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {element.description}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                <li>Click elements on canvas to select and drag</li>
                <li>Click selected elements to configure properties</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};