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
  const [lastSignature, setLastSignature] = useState<string>('');

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleUseSame = () => {
    if (lastSignature) {
      onSignatureComplete(lastSignature);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (signatureRef.current && !isEmpty) {
      const dataURL = signatureRef.current.toDataURL('image/png');
      setLastSignature(dataURL);
      onSignatureComplete(dataURL);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-card-foreground mb-1">Sign here</h3>
        <p className="text-xs text-muted-foreground">Draw your signature using your mouse or finger</p>
      </div>
      
      <div className="flex gap-3">
        <div className="flex-1 border-2 border-dashed border-border rounded">
          <ReactSignatureCanvas 
            ref={signatureRef}
            canvasProps={{
              width,
              height,
              className: 'signature-canvas bg-background'
            }}
            onBegin={handleBegin}
            onEnd={handleEnd}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClear}
            disabled={isEmpty}
            className="flex items-center gap-1 text-card-foreground border-border hover:bg-muted"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </Button>
          
          {lastSignature && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUseSame}
              className="flex items-center gap-1 text-card-foreground border-border hover:bg-muted whitespace-nowrap"
            >
              Reuse Last Signature
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};