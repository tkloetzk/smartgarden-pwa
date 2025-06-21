// src/components/care/QuickCompletionButtons.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  SmartDefaultsService,
  QuickCompletionValues,
} from "@/services/smartDefaultsService";
import { PlantRecord } from "@/types/database";

interface QuickCompletionButtonsProps {
  plant: PlantRecord;
  activityType: "water" | "fertilize";
  onQuickComplete: (values: QuickCompletionValues) => void;
  className?: string;
}

const QuickCompletionButtons = ({
  plant,
  activityType,
  onQuickComplete,
  className = "",
}: QuickCompletionButtonsProps) => {
  const [options, setOptions] = useState<Array<{
    label: string;
    values: QuickCompletionValues;
  }> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoading(true);
        const completionOptions =
          await SmartDefaultsService.getQuickCompletionOptions(
            plant,
            activityType
          );
        setOptions(completionOptions);
      } catch (error) {
        console.error("Error loading quick completion options:", error);
        setOptions(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (plant) {
      loadOptions();
    }
  }, [plant, activityType]);

  if (isLoading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full h-8 w-20"></div>
        <div className="animate-pulse bg-gray-200 rounded-full h-8 w-20"></div>
      </div>
    );
  }

  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      <span className="text-xs text-gray-500 self-center">Quick actions:</span>
      {options.map((option, index) => (
        <Button
          key={index}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickComplete(option.values)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default QuickCompletionButtons;
