import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, Check } from "lucide-react";

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  onSignatureComplete: (dataURL: string) => void;
  onCancel: () => void;
}

export const SignatureCanvas = ({ 
  width = 300, 
  height = 150, 
  onSignatureComplete,
  onCancel 
}: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
    });

    // Enable drawing mode
    canvas.isDrawingMode = true;
    
    // Configure the brush using Fabric.js v6 syntax
    canvas.freeDrawingBrush.color = "#000000";
    canvas.freeDrawingBrush.width = 2;

    // Track when drawing happens
    canvas.on('path:created', () => {
      setIsEmpty(false);
    });

    // Track when canvas is cleared
    canvas.on('canvas:cleared', () => {
      setIsEmpty(true);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    setIsEmpty(true);
  };

  const handleComplete = () => {
    if (!fabricCanvas || isEmpty) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    onSignatureComplete(dataURL);
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-lg">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-foreground mb-1">Sign here</h3>
        <p className="text-xs text-muted-foreground">Draw your signature using your mouse or finger</p>
      </div>
      
      <div className="border-2 border-dashed border-muted-foreground/30 rounded mb-3">
        <canvas 
          ref={canvasRef} 
          className="block cursor-crosshair"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClear}
          disabled={isEmpty}
          className="flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleComplete}
            disabled={isEmpty}
            className="flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};