import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { PDFElement } from "./PDFBuilder";
import { SignatureCanvas } from "./SignatureCanvas";
import { DatePicker } from "./DatePicker";

interface MobileFieldNavigationProps {
  elements: PDFElement[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  formData: { [key: string]: string | boolean };
  onFieldUpdate: (elementId: string, value: string | boolean) => void;
}

export const MobileFieldNavigation = ({
  elements,
  currentIndex,
  onNavigate,
  formData,
  onFieldUpdate
}: MobileFieldNavigationProps) => {
  const [localValue, setLocalValue] = useState<string | boolean>('');
  const currentElement = elements[currentIndex];
  
  const completedCount = elements.filter(el => 
    formData[el.id] && formData[el.id] !== false
  ).length;
  
  const progress = elements.length > 0 ? (completedCount / elements.length) * 100 : 0;
  
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < elements.length - 1;

  // Update local value when current element changes
  useEffect(() => {
    if (currentElement) {
      setLocalValue(formData[currentElement.id] || (currentElement.type === 'checkbox' ? false : ''));
    }
  }, [currentIndex, currentElement, formData]);

  const handleSave = () => {
    if (currentElement) {
      onFieldUpdate(currentElement.id, localValue);
    }
  };

  const handleCancel = () => {
    if (currentElement) {
      setLocalValue(formData[currentElement.id] || (currentElement.type === 'checkbox' ? false : ''));
    }
  };

  const handleSignatureComplete = (dataURL: string) => {
    if (currentElement) {
      onFieldUpdate(currentElement.id, dataURL);
    }
  };

  const renderFieldEditor = () => {
    if (!currentElement) return null;

    switch (currentElement.type) {
      case 'signature':
        return (
          <div className="p-4 bg-background border-t">
            <p className="text-sm font-medium mb-3">Draw your signature:</p>
            <SignatureCanvas
              width={280}
              height={120}
              onSignatureComplete={handleSignatureComplete}
              onCancel={handleCancel}
            />
          </div>
        );

      case 'date':
        return (
          <div className="p-4 bg-background border-t">
            <p className="text-sm font-medium mb-3">Select date:</p>
            <DatePicker
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(date) => setLocalValue(date)}
            />
            <div className="flex gap-2 mt-3">
              <Button variant="secondary" size="sm" onClick={handleCancel} className="flex-1">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSave} className="flex-1">
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="p-4 bg-background border-t">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-checkbox"
                  checked={localValue as boolean}
                  onCheckedChange={(checked) => {
                    setLocalValue(checked as boolean);
                    onFieldUpdate(currentElement.id, checked as boolean);
                  }}
                />
                <label htmlFor="mobile-checkbox" className="text-sm font-medium">
                  {currentElement.placeholder || 'Check this box'}
                </label>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="p-4 bg-background border-t">
            <p className="text-sm font-medium mb-3">Enter text:</p>
            <Textarea
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={currentElement.placeholder || 'Enter text...'}
              className="min-h-[80px] mb-3"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancel} className="flex-1">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSave} className="flex-1">
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-background border-t">
            <p className="text-sm font-medium mb-3">Enter value:</p>
            <Input
              type="text"
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={currentElement.placeholder || 'Enter text...'}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancel} className="flex-1">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSave} className="flex-1">
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      {/* Field Editor - Always shown */}
      {renderFieldEditor()}
      
      {/* Navigation Panel */}
      <div className="p-4">
        <div className="max-w-sm mx-auto space-y-3">
          {/* Progress */}
          <div className="text-center">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Field {currentIndex + 1} of {elements.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Field Info */}
          {currentElement && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-medium capitalize">
                  {currentElement.type}
                  {formData[currentElement.id] && formData[currentElement.id] !== false && (
                    <Check className="inline w-4 h-4 ml-1 text-green-500" />
                  )}
                </p>
              </div>
              {currentElement.placeholder && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentElement.placeholder}
                </p>
              )}
              {formData[currentElement.id] && formData[currentElement.id] !== false && (
                <p className="text-xs text-green-600 mt-1">
                  {currentElement.type === 'checkbox' 
                    ? 'Checked' 
                    : currentElement.type === 'signature' 
                      ? 'Signature added'
                      : `"${String(formData[currentElement.id]).substring(0, 30)}${String(formData[currentElement.id]).length > 30 ? '...' : ''}"`
                  }
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={!canGoPrevious}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={!canGoNext}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};