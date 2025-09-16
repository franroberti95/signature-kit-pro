import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SignatureCanvas } from "./SignatureCanvas";
import { DatePicker } from "./DatePicker";
import { PDFElement } from "./PDFBuilder";
import { X, Check } from "lucide-react";

interface FieldEditModalProps {
  element: PDFElement | null;
  isOpen: boolean;
  onClose: () => void;
  value: string | boolean;
  onSave: (value: string | boolean) => void;
}

export const FieldEditModal = ({
  element,
  isOpen,
  onClose,
  value,
  onSave
}: FieldEditModalProps) => {
  const [localValue, setLocalValue] = useState<string | boolean>(value);

  const handleSave = () => {
    onSave(localValue);
    onClose();
  };

  const handleSignatureComplete = (dataURL: string) => {
    setLocalValue(dataURL);
    onSave(dataURL);
    onClose();
  };

  if (!element) return null;

  const renderFieldInput = () => {
    switch (element.type) {
      case 'signature':
        return (
          <div className="py-4">
            <SignatureCanvas
              width={280}
              height={120}
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
                {element.placeholder || 'Check this box'}
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
              placeholder={element.placeholder || 'Enter text...'}
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
              placeholder={element.placeholder || 'Enter text...'}
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