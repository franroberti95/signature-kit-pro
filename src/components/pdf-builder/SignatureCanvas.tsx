import { useRef, useState } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";

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
  const signatureRef = useRef<ReactSignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleComplete = () => {
    if (signatureRef.current && !isEmpty) {
      const dataURL = signatureRef.current.toDataURL('image/png');
      onSignatureComplete(dataURL);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-lg">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-foreground mb-1">Sign here</h3>
        <p className="text-xs text-muted-foreground">Draw your signature using your mouse or finger</p>
      </div>
      
      <div className="border-2 border-dashed border-muted-foreground/30 rounded mb-3">
        <ReactSignatureCanvas 
          ref={signatureRef}
          canvasProps={{
            width,
            height,
            className: 'signature-canvas'
          }}
          onBegin={handleBegin}
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