import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Check, X, Trash2 } from "lucide-react";
import { PDFElement } from "./PDFBuilder";
import { DatePicker } from "./DatePicker";
import { SignatureCanvas } from "./SignatureCanvas";
import { toast } from "sonner";
import { COMMON_VARIABLES } from "@/constants/variables";

interface MobileFieldNavigationProps {
  elements: PDFElement[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  formData: { [key: string]: string | boolean };
  onFieldUpdate: (elementId: string, value: string | boolean) => void;
  onDownload?: () => void;
}

export const MobileFieldNavigation = ({
  elements,
  currentIndex,
  onNavigate,
  formData,
  onFieldUpdate,
  onDownload
}: MobileFieldNavigationProps) => {
  const [localValue, setLocalValue] = useState<string | boolean>('');
  
  // Filter out pre-populated fields from stepper navigation
  const isFieldPrePopulated = (element: PDFElement) => {
    // Check if field is marked as pre-populated or has a pre-defined value
    if (element.preDefinedValueId || element.defaultValue) {
      return true;
    }
    
    // Check against COMMON_VARIABLES for pre-populated fields
    if (element.id && element.id.startsWith('rich-text-')) {
      const variableName = element.id.replace('rich-text-', '');
      const variable = COMMON_VARIABLES.find(v => v.name === variableName);
      return variable?.prePopulated === true;
    }
    
    // Check by label match
    const variable = COMMON_VARIABLES.find(v => 
      v.label === element.preDefinedLabel || 
      v.name === element.placeholder?.toLowerCase().replace(/\s+/g, '_')
    );
    return variable?.prePopulated === true;
  };
  
  // Only show non-pre-populated fields in stepper
  const interactiveElements = elements.filter(el => !isFieldPrePopulated(el));
  const currentElement = interactiveElements[currentIndex];
  
  const completedCount = interactiveElements.filter(el => 
    formData[el.id] && formData[el.id] !== false
  ).length;
  
  const progress = interactiveElements.length > 0 ? (completedCount / interactiveElements.length) * 100 : 0;
  
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < interactiveElements.length - 1;
  const isLastField = currentIndex === interactiveElements.length - 1;

  // Validation helper functions
  const isFieldRequired = (element: PDFElement) => {
    return element.required !== false; // Default to required unless explicitly set to false
  };

  const validateAllRequiredFields = () => {
    const emptyRequiredFields = interactiveElements
      .filter(el => isFieldRequired(el))
      .filter(el => {
        const value = formData[el.id];
        return !value || 
               (typeof value === 'string' && value.trim() === '') ||
               (typeof value === 'boolean' && value === false);
      });

    return emptyRequiredFields;
  };

  const emptyRequiredFields = validateAllRequiredFields();
  const allRequiredFieldsFilled = emptyRequiredFields.length === 0;

  // Update local value when current element changes
  useEffect(() => {
    if (currentElement) {
      const currentValue = formData[currentElement.id] || (currentElement.type === 'checkbox' ? false : '');
      setLocalValue(currentValue);
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

  const handleNext = () => {
    // Allow navigation to next field even if current field is empty
    // Validation is now handled by the Done button
    onNavigate(currentIndex + 1);
  };

  const handleDone = () => {
    const emptyFields = validateAllRequiredFields();
    if (emptyFields.length === 0) {
      onDownload?.();
    } else {
      const fieldNames = emptyFields.map(el => 
        el.preDefinedLabel || el.placeholder || `Field ${elements.indexOf(el) + 1}`
      ).join(', ');
      
      toast.error("Required fields missing", {
        description: `Please fill in: ${fieldNames}`
      });
      
      // Navigate to first empty required field
      const firstEmptyIndex = elements.indexOf(emptyFields[0]);
      if (firstEmptyIndex !== -1) {
        onNavigate(firstEmptyIndex);
      }
    }
  };

  const renderFieldEditor = () => {
    if (!currentElement) return null;

    // Common props for input styling (no red borders)
    const getInputClassName = (baseClassName: string) => {
      return baseClassName; // Remove red border styling
    };

    const getFieldLabel = () => {
      // Use proper label with correct capitalization from COMMON_VARIABLES
      let label = currentElement.preDefinedLabel || currentElement.placeholder || 'Field';
      
      // Extract variable name from element ID if it follows rich-text-{variable} pattern
      if (currentElement.id && currentElement.id.startsWith('rich-text-')) {
        const variableName = currentElement.id.replace('rich-text-', '');
        const variable = COMMON_VARIABLES.find(v => v.name === variableName);
        if (variable?.label) {
          label = variable.label;
        }
      }
      
      // Also check by matching label text to COMMON_VARIABLES
      const matchedVariable = COMMON_VARIABLES.find(v => 
        v.label?.toLowerCase() === label.toLowerCase().trim() ||
        v.name.replace(/_/g, ' ').toLowerCase() === label.toLowerCase().trim()
      );
      if (matchedVariable?.label) {
        label = matchedVariable.label;
      }
      
      return (
        <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2">
          {label}
          {isFieldRequired(currentElement) && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </label>
      );
    };

    switch (currentElement.type) {
      case 'signature':
        return (
          <div className="p-4 bg-background border-t">
          <div className="space-y-2">
            {getFieldLabel()}
            <div className="flex justify-center p-2 rounded-md border-2 border-border">
                <SignatureCanvas
                  width={240}
                  height={80}
                  onSignatureComplete={(dataURL) => {
                    setLocalValue(dataURL);
                    onFieldUpdate(currentElement.id, dataURL);
                  }}
                  onCancel={() => {
                    // No cancel action needed in mobile nav
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'date':
        return (
          <div className="p-4 bg-background border-t">
            <div className="space-y-2">
              {getFieldLabel()}
              <Input
                type="date"
                value={typeof localValue === 'string' ? localValue : ''}
                onChange={(e) => {
                  setLocalValue(e.target.value);
                  onFieldUpdate(currentElement.id, e.target.value);
                }}
                className={getInputClassName("bg-card text-card-foreground border-input")}
              />
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="p-4 bg-background border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-center p-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile-checkbox"
                    checked={localValue as boolean}
                    onCheckedChange={(checked) => {
                      setLocalValue(checked as boolean);
                      onFieldUpdate(currentElement.id, checked as boolean);
                    }}
                  />
                  <label htmlFor="mobile-checkbox" className="text-sm font-medium flex items-center gap-1">
                    {currentElement.preDefinedLabel || currentElement.placeholder || 'Check this box'}
                    {isFieldRequired(currentElement) && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="p-4 bg-background border-t">
            <div className="space-y-2">
              {getFieldLabel()}
              <Textarea
                value={typeof localValue === 'string' ? localValue : ''}
                onChange={(e) => {
                  setLocalValue(e.target.value);
                  onFieldUpdate(currentElement.id, e.target.value);
                }}
                placeholder={currentElement.preDefinedLabel || currentElement.placeholder || 'Enter text...'}
                className={getInputClassName("min-h-[80px] bg-card text-foreground border-input")}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-background border-t">
            <div className="space-y-2">
              {getFieldLabel()}
              <Input
                type="text"
                value={typeof localValue === 'string' ? localValue : ''}
                onChange={(e) => {
                  setLocalValue(e.target.value);
                  onFieldUpdate(currentElement.id, e.target.value);
                }}
                placeholder={currentElement.preDefinedLabel || currentElement.placeholder || 'Enter text...'}
                className={getInputClassName("bg-card text-foreground border-input")}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      {/* Progress Bar at Top */}
      <div className="px-4 py-2 border-b bg-muted/50">
        <div className="max-w-sm mx-auto md:max-w-lg">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Field {currentIndex + 1} of {interactiveElements.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Field Editor */}
      {renderFieldEditor()}
      
      {/* Removed red error message bar - validation info now shown on Done button */}

      {/* Navigation Panel - Always show */}
      <div className="p-3 border-t bg-muted/30">
        <div className="max-w-sm mx-auto md:max-w-lg">
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
            
            {isLastField ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleDone}
                disabled={!allRequiredFieldsFilled}
                className={`flex-1 transition-colors ${
                  allRequiredFieldsFilled 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                }`}
                title={!allRequiredFieldsFilled ? `Complete ${emptyRequiredFields.length} required field(s) to finish` : 'Complete and download PDF'}
              >
                {allRequiredFieldsFilled ? 'Done' : `${emptyRequiredFields.length} fields required`}
                <Check className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex-1"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};