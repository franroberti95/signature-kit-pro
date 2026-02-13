import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SignatureCanvas } from "./SignatureCanvas";
import { TRUE_A4_DIMENSIONS } from "@/constants/dimensions";
import { DatePicker } from "./DatePicker";
import { PDFElement } from "./PDFBuilder";
import { X, Check } from "lucide-react";

interface FieldEditModalProps {
  element: PDFElement | null;
  isOpen: boolean;
  onClose: () => void;
  value: string | boolean;
  onSave: (value: string | boolean, role?: 'source' | 'target') => void;
}

export const FieldEditModal = ({
  element,
  isOpen,
  onClose,
  value,
  onSave
}: FieldEditModalProps) => {
  const [localValue, setLocalValue] = useState<string | boolean>(value);
  const [localRole, setLocalRole] = useState<'source' | 'target'>('target');

  useEffect(() => {
    if (isOpen) {
      setLocalValue(value);
      setLocalRole(element?.role || 'target');
    }
  }, [isOpen, value, element]);

  const handleSave = () => {
    onSave(localValue, localRole);
    onClose();
  };

  const handleSignatureComplete = (dataURL: string) => {
    setLocalValue(dataURL);
    // For signature directly, we might want to save immediately or wait for save button
    // But consistent with original, we wait for save button unless we want auto-save
    // Original implementation called onSave immediately for signature?
    // Let's keep it simple: update local state, user must click Save.
    // Wait, original might have closed on signature complete.
    // Let's look at previous version... it did `onSave(dataURL); onClose();`
    // So let's do that but include role.
    onSave(dataURL, localRole);
    onClose();
  };

  if (!element) return null;

  const renderFieldInput = () => {
    switch (element.type) {
      case 'signature':
        return (
          <div className="py-4">
            <SignatureCanvas
              width={TRUE_A4_DIMENSIONS.SIGNATURE_WIDTH}
              height={TRUE_A4_DIMENSIONS.SIGNATURE_HEIGHT}
              onSignatureComplete={handleSignatureComplete}
              onCancel={onClose}
            />
          </div>
        );

      case 'date':
        return (
          <div className="py-4">
            <DatePicker
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(date) => setLocalValue(date)}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="py-4 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="checkbox-field"
                checked={localValue as boolean}
                onCheckedChange={(checked) => setLocalValue(checked as boolean)}
              />
              <label htmlFor="checkbox-field" className="text-sm font-medium">
                {element.preDefinedLabel || element.placeholder || 'Check this box'}
              </label>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="py-4">
            <Textarea
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={element.preDefinedLabel || element.placeholder || 'Enter text...'}
              className="min-h-[100px]"
              autoFocus
            />
          </div>
        );

      default:
        return (
          <div className="py-4">
            <Input
              type="text"
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={element.preDefinedLabel || element.placeholder || 'Enter text...'}
              autoFocus
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {element.type === 'signature' ? 'Add Signature' : `Edit ${element.type}`}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <label className="text-sm font-medium text-foreground block mb-2">Who fills this?</label>
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${localRole === 'source'
                  ? 'bg-background shadow-sm text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              onClick={() => setLocalRole('source')}
            >
              Sender (Pre-fill)
            </button>
            <button
              className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${(localRole === 'target' || !localRole)
                  ? 'bg-background shadow-sm text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              onClick={() => setLocalRole('target')}
            >
              Signer (Recipient)
            </button>
          </div>
        </div>

        {renderFieldInput()}

        {element.type !== 'signature' && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};