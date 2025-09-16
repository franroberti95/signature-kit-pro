import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Check, X, Trash2 } from "lucide-react";
import { PDFElement } from "./PDFBuilder";
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
      setLocalValue(dataURL);
      onFieldUpdate(currentElement.id, dataURL);
    }
  };

  const renderFieldEditor = () => {
    if (!currentElement) return null;

    switch (currentElement.type) {
      case 'signature':
        return (
          <div className="p-4 bg-background border-t">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-foreground mb-1">Sign here</h3>
              <p className="text-xs text-muted-foreground">Draw your signature using your mouse or finger</p>
            </div>
            
            <div className="flex justify-center mb-3">
              <div className="border-2 border-dashed border-muted-foreground/30 rounded bg-white" style={{ width: '240px', height: '80px' }}>
                <canvas
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        let isDrawing = false;
                        let lastX = 0;
                        let lastY = 0;

                        const startDrawing = (e: MouseEvent | TouchEvent) => {
                          isDrawing = true;
                          const rect = canvas.getBoundingClientRect();
                          const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                          const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                          lastX = clientX - rect.left;
                          lastY = clientY - rect.top;
                        };

                        const draw = (e: MouseEvent | TouchEvent) => {
                          if (!isDrawing) return;
                          e.preventDefault();
                          
                          const rect = canvas.getBoundingClientRect();
                          const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                          const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                          const currentX = clientX - rect.left;
                          const currentY = clientY - rect.top;

                          ctx.strokeStyle = '#000';
                          ctx.lineWidth = 2;
                          ctx.lineCap = 'round';
                          ctx.lineJoin = 'round';
                          
                          ctx.beginPath();
                          ctx.moveTo(lastX, lastY);
                          ctx.lineTo(currentX, currentY);
                          ctx.stroke();

                          lastX = currentX;
                          lastY = currentY;

                          // Save signature when drawing
                          const dataURL = canvas.toDataURL('image/png');
                          setLocalValue(dataURL);
                          onFieldUpdate(currentElement.id, dataURL);
                        };

                        const stopDrawing = () => {
                          isDrawing = false;
                        };

                        // Mouse events
                        canvas.addEventListener('mousedown', startDrawing);
                        canvas.addEventListener('mousemove', draw);
                        canvas.addEventListener('mouseup', stopDrawing);
                        canvas.addEventListener('mouseout', stopDrawing);

                        // Touch events
                        canvas.addEventListener('touchstart', startDrawing);
                        canvas.addEventListener('touchmove', draw);
                        canvas.addEventListener('touchend', stopDrawing);

                        // Clear canvas button functionality
                        const clearCanvas = () => {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          setLocalValue('');
                          onFieldUpdate(currentElement.id, '');
                        };

                        // Store clear function for button access
                        (canvas as any).clearSignature = clearCanvas;

                        // Load existing signature if any
                        if (typeof localValue === 'string' && localValue.startsWith('data:image/')) {
                          const img = new Image();
                          img.onload = () => {
                            ctx.drawImage(img, 0, 0);
                          };
                          img.src = localValue;
                        }
                      }
                    }
                  }}
                  width={240}
                  height={80}
                  className="w-full touch-none"
                  style={{ touchAction: 'none' }}
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const canvas = document.querySelector('canvas') as HTMLCanvasElement & { clearSignature?: () => void };
                  if (canvas?.clearSignature) {
                    canvas.clearSignature();
                  }
                }}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </Button>
            </div>
          </div>
        );

      case 'date':
        return (
          <div className="p-4 bg-background border-t">
            <Input
              type="date"
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onFieldUpdate(currentElement.id, e.target.value);
              }}
              className="bg-card text-card-foreground border-input"
            />
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
            <Textarea
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onFieldUpdate(currentElement.id, e.target.value);
              }}
              placeholder=""
              className="min-h-[80px] bg-card text-foreground border-input"
            />
          </div>
        );

      default:
        return (
          <div className="p-4 bg-background border-t">
            <Input
              type="text"
              value={typeof localValue === 'string' ? localValue : ''}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onFieldUpdate(currentElement.id, e.target.value);
              }}
              placeholder=""
              className="bg-card text-foreground border-input"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 md:max-h-64">
      {/* Progress Bar at Top */}
      <div className="px-4 py-2 border-b bg-muted/50">
        <div className="max-w-sm mx-auto md:max-w-lg">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Field {currentIndex + 1} of {elements.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Field Editor */}
      {renderFieldEditor()}
      
      {/* Navigation Panel */}
      <div className="p-3">
        <div className="max-w-sm mx-auto md:max-w-lg">
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