import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { PDFElement } from "./PDFBuilder";

interface MobileFieldNavigationProps {
  elements: PDFElement[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  formData: { [key: string]: string | boolean };
}

export const MobileFieldNavigation = ({
  elements,
  currentIndex,
  onNavigate,
  formData
}: MobileFieldNavigationProps) => {
  const completedCount = elements.filter(el => 
    formData[el.id] && formData[el.id] !== false
  ).length;
  
  const progress = elements.length > 0 ? (completedCount / elements.length) * 100 : 0;
  
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < elements.length - 1;
  const isCompleted = formData[elements[currentIndex]?.id] && formData[elements[currentIndex]?.id] !== false;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50">
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
        {elements[currentIndex] && (
          <div className="text-center">
            <p className="text-sm font-medium capitalize">
              {elements[currentIndex].type}
              {isCompleted && <Check className="inline w-4 h-4 ml-1 text-green-500" />}
            </p>
            {elements[currentIndex].placeholder && (
              <p className="text-xs text-muted-foreground">
                {elements[currentIndex].placeholder}
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={!canGoPrevious}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <Button
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
  );
};