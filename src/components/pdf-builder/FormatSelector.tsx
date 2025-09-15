import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export type PDFFormat = "A4" | "A5" | "Letter";

interface FormatOption {
  format: PDFFormat;
  dimensions: string;
  description: string;
}

const formatOptions: FormatOption[] = [
  {
    format: "A4",
    dimensions: "210 × 297 mm",
    description: "Standard international",
  },
  {
    format: "A5",
    dimensions: "148 × 210 mm",
    description: "Compact size",
  },
  {
    format: "Letter",
    dimensions: "8.5 × 11 in",
    description: "US standard",
  },
];

interface FormatSelectorProps {
  onFormatSelect: (format: PDFFormat) => void;
}

export const FormatSelector = ({ onFormatSelect }: FormatSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {formatOptions.map((option) => (
        <Card key={option.format} className="hover:shadow-md transition-all duration-fast cursor-pointer group">
          <CardContent className="p-0">
            <Button
              variant="format-card"
              size="format-card"
              onClick={() => onFormatSelect(option.format)}
              className="w-full h-full"
            >
              <FileText className="w-8 h-8 text-primary group-hover:text-primary-hover transition-colors" />
              <div className="text-center mt-2">
                <div className="font-semibold text-foreground">{option.format}</div>
                <div className="text-xs text-muted-foreground">{option.dimensions}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};